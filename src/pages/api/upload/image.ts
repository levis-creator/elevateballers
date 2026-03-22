import type { APIRoute } from 'astro';
import { requireAdmin, getCurrentUser } from '@/features/auth/lib/auth';
import { prisma } from '../../../lib/prisma';
import { saveFile, sanitizeFolderName } from '../../../lib/file-storage';
import { compressImage, shouldCompress } from '../../../lib/image-compression';
import { getFolderByName } from '../../../lib/folder-access';
import { requirePermission } from '@/features/rbac/domain/usecases/middleware';
import { handleApiError } from '../../../lib/apiError';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    // Require admin authentication
    const user = await requirePermission(request, 'media:create');

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folderName = (formData.get('folder') as string) || 'general';
    const isPrivate = formData.get('isPrivate') === 'true' || formData.get('isPrivate') === '1';
    const title = (formData.get('title') as string) || file.name;
    const tagsParam = formData.get('tags') as string | null;
    let tags: string[] | null = null;
    if (tagsParam) {
      try {
        tags = JSON.parse(tagsParam);
      } catch {
        // If parsing fails, ignore tags
      }
    }

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.' }),
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
      // Create folder if it doesn't exist
      // Path format: "public/folder-name" or "private/folder-name"
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
      // Update folder privacy if changed (but keep existing path structure)
      if (folder.isPrivate !== isPrivate) {
        // Update path to reflect new privacy status
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
        console.warn('Image compression failed, using original:', error);
        // Continue with original buffer if compression fails
      }
    }

    // Determine file extension from MIME type or original filename
    let fileExtension = 'jpg'; // default
    if (file.type === 'image/png') fileExtension = 'png';
    else if (file.type === 'image/gif') fileExtension = 'gif';
    else if (file.type === 'image/webp') fileExtension = 'webp';
    else if (file.type === 'image/jpeg' || file.type === 'image/jpg') fileExtension = 'jpg';
    
    // Generate filename with correct extension
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const fileName = `${timestamp}-${randomStr}.${fileExtension}`;

    // Save file to local storage with proper extension
    const { filePath, publicUrl, fullPath } = await saveFile(
      sanitizedFolderName,
      finalBuffer,
      folder.isPrivate,
      fileName
    );

    // Determine media type
    const mediaType = file.type.startsWith('image/') ? 'IMAGE' : 
                     file.type.startsWith('video/') ? 'VIDEO' : 'AUDIO';

    // For images, automatically set thumbnail to the same URL as the main image
    // For videos/audio, thumbnail can be set separately later
    const thumbnailUrl = mediaType === 'IMAGE' ? publicUrl : undefined;

    // Create Media record in database
    const media = await prisma.media.create({
      data: {
        title: title || file.name,
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
        tags: tags ? tags : null,
      },
      include: {
        folder: true,
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
        id: media.id,
        url: media.url,
        thumbnail: media.thumbnail,
        filePath: media.filePath,
        title: media.title,
        folder: {
          id: folder.id,
          name: folder.name,
          isPrivate: folder.isPrivate,
        },
        size: media.size,
        originalSize: media.originalSize,
        compressionRatio: media.compressionRatio,
        mimeType: media.mimeType,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error uploading image:', error);
    return handleApiError(error, 'upload image', request);
  }
};
