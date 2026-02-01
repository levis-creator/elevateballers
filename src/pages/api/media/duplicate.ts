import type { APIRoute } from 'astro';
import { requireAdmin } from '../../../features/cms/lib/auth';
import { prisma } from '../../../lib/prisma';
import { promises as fs } from 'fs';
import { join } from 'path';
import { fileExists } from '../../../lib/file-storage';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    await requireAdmin(request);
    const { mediaId } = await request.json();

    if (!mediaId) {
      return new Response(
        JSON.stringify({ error: 'Media ID is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get the original media item
    const originalMedia = await prisma.media.findUnique({
      where: { id: mediaId },
      include: {
        folder: true,
      },
    });

    if (!originalMedia) {
      return new Response(
        JSON.stringify({ error: 'Media not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // If the media has a filePath, duplicate the physical file
    let newFilePath: string | null = null;
    let newUrl: string | null = null;

    if (originalMedia.filePath) {
      try {
        // Check if file exists
        const exists = await fileExists(originalMedia.filePath);
        if (!exists) {
          return new Response(
            JSON.stringify({ error: 'Source file not found' }),
            {
              status: 404,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

        const projectRoot = process.cwd();
        // filePath format is "uploads/public/..." or "uploads/private/..."
        // Actual file location is "public/uploads/public/..." or "public/uploads/private/..."
        const normalizedPath = originalMedia.filePath.startsWith('public/') 
          ? originalMedia.filePath 
          : `public/${originalMedia.filePath}`;
        const sourcePath = join(projectRoot, normalizedPath);

        // Read the original file
        const fileBuffer = await readFile(sourcePath);

        // Generate new filename
        const pathParts = originalMedia.filePath.split('/');
        const fileName = pathParts[pathParts.length - 1];
        const nameParts = fileName.split('.');
        const ext = nameParts.length > 1 ? nameParts.pop() : '';
        const baseName = nameParts.join('.');
        const timestamp = Date.now();
        const newFileName = `${baseName}-copy-${timestamp}${ext ? '.' + ext : ''}`;

        // Determine destination folder
        const folderPath = originalMedia.folder?.path || 'public/general';
        const destPath = join(projectRoot, folderPath, newFileName);

        // Write the duplicate file
        await writeFile(destPath, fileBuffer);

        // Set new paths
        newFilePath = `${folderPath}/${newFileName}`;
        newUrl = `/${folderPath}/${newFileName}`;
      } catch (fileError: any) {
        console.error('Error duplicating file:', fileError);
        // Continue without file duplication - create DB record only
      }
    }

    // Create duplicate media record
    const duplicateMedia = await prisma.media.create({
      data: {
        title: `${originalMedia.title} (Copy)`,
        url: newUrl || originalMedia.url,
        thumbnail: originalMedia.thumbnail,
        filePath: newFilePath || originalMedia.filePath,
        folderId: originalMedia.folderId,
        type: originalMedia.type,
        size: originalMedia.size,
        originalSize: originalMedia.originalSize,
        compressionRatio: originalMedia.compressionRatio,
        mimeType: originalMedia.mimeType,
        isPrivate: originalMedia.isPrivate,
        uploadedBy: originalMedia.uploadedBy,
        tags: originalMedia.tags,
      },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
            isPrivate: true,
          },
        },
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        media: duplicateMedia,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error duplicating media:', error);
    return new Response(
      JSON.stringify({
        error: error.message === 'Unauthorized' || error.message.includes('Forbidden')
          ? 'Unauthorized'
          : error.message || 'Failed to duplicate media',
      }),
      {
        status: error.message === 'Unauthorized' || error.message.includes('Forbidden') ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
