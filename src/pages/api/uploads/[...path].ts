/**
 * Protected File Serving API
 * Serves files from private folders with access control
 * Public files are served directly by the static file server
 */

import type { APIRoute } from 'astro';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getCurrentUser } from '../../../features/cms/lib/auth';
import { checkFolderAccess } from '../../../lib/folder-access';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../../..');
const uploadsBasePath = join(projectRoot, 'public', 'uploads');

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
    // Sanitize folder name and file name
    const sanitizedFolderName = folderName.replace(/\.\./g, '').replace(/[^a-zA-Z0-9\-_]/g, '');
    const sanitizedFileName = fileName.replace(/\.\./g, '').replace(/[^a-zA-Z0-9\-_.]/g, '');
    
    if (!sanitizedFolderName || !sanitizedFileName) {
      return new Response('Invalid path', { status: 400 });
    }
    
    // Construct file path using sanitized values
    const filePath = join(uploadsBasePath, privacyLevel, sanitizedFolderName, sanitizedFileName);
    
    // Double-check: Ensure the resolved path is still within uploads directory
    const normalizedPath = join(uploadsBasePath, privacyLevel, sanitizedFolderName, sanitizedFileName);
    if (!normalizedPath.startsWith(uploadsBasePath)) {
      return new Response('Invalid path', { status: 400 });
    }

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return new Response('File not found', { status: 404 });
    }

    // Read file
    const fileBuffer = await fs.readFile(filePath);
    
    // Determine content type from file extension
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
          ? 'private, max-age=3600' // Private files: shorter cache, no public caching
          : 'public, max-age=31536000, immutable', // Public files: long cache
        'Content-Disposition': `inline; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    console.error('Error serving file:', error);
    return new Response('Internal server error', { status: 500 });
  }
};
