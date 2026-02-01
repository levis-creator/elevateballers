import type { APIRoute } from 'astro';
import { requireAdmin } from '../../../features/cms/lib/auth';
import { prisma } from '../../../lib/prisma';
import { saveFile, sanitizeFolderName } from '../../../lib/file-storage';
import { compressImage, shouldCompress } from '../../../lib/image-compression';
import { getFolderByName } from '../../../lib/folder-access';

export const prerender = false;

interface UploadResult {
  id: string;
  url: string;
  thumbnail?: string;
  filePath?: string;
  title: string;
  folder: {
    id: string;
    name: string;
    isPrivate: boolean;
  };
  size?: number;
  originalSize?: number;
  compressionRatio?: number;
  mimeType?: string;
  error?: string;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // Require admin authentication
    const user = await requireAdmin(request);

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const folderName = (formData.get('folder') as string) || 'general';
    const isPrivate = formData.get('isPrivate') === 'true' || formData.get('isPrivate') === '1';

    if (!files || files.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No files provided' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: `Invalid file types. Only JPEG, PNG, GIF, and WebP images are allowed. Invalid files: ${invalidFiles.map(f => f.name).join(', ')}` 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Sanitize folder name
    const sanitizedFolderName = sanitizeFolderName(folderName);
    
    // Get or create folder in database
    let folder = await getFolderByName(sanitizedFolderName);
    if (!folder) {
      const folderPath = `${isPrivate ? 'private' : 'public'}/${sanitizedFolderName}`;
      folder = await prisma.folder.create({
        data: {
          name: sanitizedFolderName,
          path: folderPath,
          isPrivate,
          createdBy: user.id,
        },
      });
    } else {
      if (folder.isPrivate !== isPrivate) {
        const newPath = `${isPrivate ? 'private' : 'public'}/${sanitizedFolderName}`;
        folder = await prisma.folder.update({
          where: { id: folder.id },
          data: { 
            isPrivate,
            path: newPath,
          },
        });
      }
    }

    // Process each file
    const results: UploadResult[] = [];

    for (const file of files) {
      try {
        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const originalBuffer = Buffer.from(arrayBuffer);
        const originalSize = originalBuffer.length;

        // Compress image if needed
        let finalBuffer = originalBuffer;
        let compressionResult = {
          buffer: originalBuffer,
          originalSize,
          compressedSize: originalSize,
          compressionRatio: 0,
        };

        if (shouldCompress(originalSize, file.type)) {
          try {
            compressionResult = await compressImage(originalBuffer, {
              maxWidthOrHeight: 1920,
              quality: 0.8,
              mimeType: file.type,
            });
            finalBuffer = compressionResult.buffer;
          } catch (error) {
            console.warn(`Image compression failed for ${file.name}, using original:`, error);
          }
        }

        // Determine file extension from MIME type
        let fileExtension = 'jpg';
        if (file.type === 'image/png') fileExtension = 'png';
        else if (file.type === 'image/gif') fileExtension = 'gif';
        else if (file.type === 'image/webp') fileExtension = 'webp';
        else if (file.type === 'image/jpeg' || file.type === 'image/jpg') fileExtension = 'jpg';
        
        // Generate filename with correct extension
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 15);
        const fileName = `${timestamp}-${randomStr}.${fileExtension}`;

        // Save file to local storage
        const { filePath, publicUrl } = await saveFile(
          sanitizedFolderName,
          finalBuffer,
          folder.isPrivate,
          fileName
        );

        // Determine media type
        const mediaType = file.type.startsWith('image/') ? 'IMAGE' : 
                         file.type.startsWith('video/') ? 'VIDEO' : 'AUDIO';

        // For images, automatically set thumbnail to the same URL
        const thumbnailUrl = mediaType === 'IMAGE' ? publicUrl : undefined;

        // Create Media record in database
        const media = await prisma.media.create({
          data: {
            title: file.name,
            url: publicUrl,
            thumbnail: thumbnailUrl,
            filePath,
            folderId: folder.id,
            type: mediaType,
            size: compressionResult.compressedSize,
            originalSize: compressionResult.originalSize,
            compressionRatio: compressionResult.compressionRatio,
            mimeType: file.type,
            isPrivate: folder.isPrivate,
            uploadedBy: user.id,
          },
          include: {
            folder: true,
          },
        });

        results.push({
          id: media.id,
          url: media.url,
          thumbnail: media.thumbnail || undefined,
          filePath: media.filePath || undefined,
          title: media.title,
          folder: {
            id: folder.id,
            name: folder.name,
            isPrivate: folder.isPrivate,
          },
          size: media.size || undefined,
          originalSize: media.originalSize || undefined,
          compressionRatio: media.compressionRatio || undefined,
          mimeType: media.mimeType || undefined,
        });
      } catch (error: any) {
        console.error(`Error uploading file ${file.name}:`, error);
        results.push({
          id: '',
          url: '',
          title: file.name,
          folder: {
            id: folder.id,
            name: folder.name,
            isPrivate: folder.isPrivate,
          },
          error: error.message || 'Failed to upload file',
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        total: files.length,
        successful: results.filter(r => !r.error).length,
        failed: results.filter(r => r.error).length,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in batch upload:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message === 'Unauthorized' || error.message.includes('Forbidden') 
          ? 'Unauthorized' 
          : error.message || 'Failed to upload files' 
      }),
      {
        status: error.message === 'Unauthorized' || error.message.includes('Forbidden') ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
