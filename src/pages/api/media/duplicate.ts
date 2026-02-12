import type { APIRoute } from 'astro';
import { requirePermission } from '../../../features/rbac/middleware';
import { prisma } from '../../../lib/prisma';
import { saveFile, readFile, getStorageType } from '../../../lib/file-storage';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    await requirePermission(request, 'media:create');
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

    // Duplication logic
    let newFilePath: string | null = null;
    let newUrl: string | null = null;

    if (originalMedia.filePath) {
      try {
        // Read the original file via unified helper
        // filePath in DB is "uploads/public/folder/file.ext"
        // readFile expects path relative to uploads dir, so we remove "uploads/"
        const relativePath = originalMedia.filePath.replace(/^uploads\//, '');
        const fileBuffer = await readFile(relativePath);

        // Generate new filename
        const originalFileName = originalMedia.filePath.split('/').pop() || 'file';
        const nameParts = originalFileName.split('.');
        const ext = nameParts.length > 1 ? nameParts.pop() : '';
        const baseName = nameParts.join('.');
        const timestamp = Date.now();
        const newFileName = `${baseName}-copy-${timestamp}${ext ? '.' + ext : ''}`;

        // Save to storage (local or supabase)
        const folderName = originalMedia.folder?.name || 'general';
        const { filePath, publicUrl } = await saveFile(
          folderName,
          fileBuffer,
          originalMedia.isPrivate,
          newFileName
        );

        newFilePath = filePath;
        newUrl = publicUrl;
      } catch (fileError: any) {
        console.error('Error duplicating file:', fileError);
        // Continue but result might be broken
      }
    }

    // Create duplicate media record
    const duplicateMedia = await prisma.media.create({
      data: {
        title: `${originalMedia.title} (Copy)`,
        url: newUrl || originalMedia.url,
        thumbnail: originalMedia.type === 'IMAGE' ? (newUrl || originalMedia.thumbnail) : originalMedia.thumbnail,
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
