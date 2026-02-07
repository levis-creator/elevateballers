import type { APIRoute } from 'astro';
import { getCurrentUser } from '../../../features/cms/lib/auth';
import { checkFolderAccess } from '../../../lib/folder-access';
import { readFile } from '../../../lib/file-storage';

export const prerender = false;

/**
 * GET /api/uploads/[...path]
 * Serve files from uploads directory with access control
 * Format: /api/uploads/public/folder/file.jpg or /api/uploads/private/folder/file.jpg
 */
export const GET: APIRoute = async ({ params, request }) => {
  try {
    // Get the path segments
    const pathSegments = params.path?.split('/') || [];

    if (pathSegments.length < 2) {
      return new Response('Invalid path', { status: 400 });
    }

    const [privacyLevel, folderName, ...fileParts] = pathSegments;
    const fileName = fileParts.join('/');

    if (!privacyLevel || !folderName || !fileName) {
      return new Response('Invalid path format', { status: 400 });
    }

    // Check if this is a private folder
    const isPrivate = privacyLevel === 'private';

    if (isPrivate) {
      // Check user authentication and access
      const user = await getCurrentUser(request);

      if (!user) {
        return new Response('Unauthorized', {
          status: 401,
          headers: { 'Content-Type': 'text/plain' },
        });
      }

      // Check folder access
      const folderPath = `${privacyLevel}/${folderName}`;
      const hasAccess = await checkFolderAccess(folderPath, user);

      if (!hasAccess) {
        return new Response('Forbidden', {
          status: 403,
          headers: { 'Content-Type': 'text/plain' },
        });
      }
    }

    // Security: Prevent path traversal
    const sanitizedFolderName = folderName.replace(/\.\./g, '').replace(/[^a-zA-Z0-9\-_]/g, '');
    const sanitizedFileName = fileName.replace(/\.\./g, '').replace(/[^a-zA-Z0-9\-_.]/g, '');

    if (!sanitizedFolderName || !sanitizedFileName) {
      return new Response('Invalid path', { status: 400 });
    }

    const fullRelativePath = `${privacyLevel}/${sanitizedFolderName}/${sanitizedFileName}`;

    // Read file via storage helper (handles local vs supabase)
    let fileBuffer;
    try {
      fileBuffer = await readFile(fullRelativePath);
    } catch (err: any) {
      if (err.message?.includes('ENOENT') || err.message?.includes('not found')) {
        return new Response('File not found', { status: 404 });
      }
      throw err;
    }

    // Determine content type
    const ext = fileName.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      mp4: 'video/mp4',
      mp3: 'audio/mpeg',
      pdf: 'application/pdf',
      json: 'application/json',
    };

    const contentType = ext ? mimeTypes[ext] || 'application/octet-stream' : 'application/octet-stream';

    // Return file with appropriate headers
    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': isPrivate
          ? 'private, max-age=3600'
          : 'public, max-age=31536000, immutable',
        'Content-Disposition': `inline; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    console.error('Error serving file:', error);
    return new Response('Internal server error', { status: 500 });
  }
};
