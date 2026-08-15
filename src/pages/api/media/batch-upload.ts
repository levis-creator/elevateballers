import type { APIRoute } from 'astro';
import { requirePermission } from '../../../features/rbac/middleware';
import { prisma } from '../../../lib/prisma';
import { deleteFile, saveFile, sanitizeFolderName } from '../../../lib/file-storage';
import { compressImage, shouldCompress } from '../../../lib/image-compression';
import { getFolderByName } from '../../../lib/folder-access';
import { handleApiError } from '../../../lib/apiError';
import { enforceRateLimit } from '../../../lib/rateLimit';
import { siteSettingsService, resolveSecuritySettings } from '../../../features/settings';

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
    const user = await requirePermission(request, 'media:batch_upload');

    const security = resolveSecuritySettings(await siteSettingsService.list('security').catch(() => []));
    const limited = await enforceRateLimit(
      `upload:${user.id}:batch`,
      security.security_mediaUploadRateLimitMax,
      security.security_mediaUploadRateLimitWindowMinutes * 60 * 1000,
      'Too many uploads. Please try again shortly.',
    );
    if (limited) return limited;

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

    if (files.length > security.security_batchUploadMaxFiles) {
      return new Response(
        JSON.stringify({ error: `Too many files. A maximum of ${security.security_batchUploadMaxFiles} files are allowed per batch upload.` }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const maxFileBytes = security.security_mediaUploadMaxSizeMB * 1024 * 1024;
    const oversizedFiles = files.filter((file) => file.size > maxFileBytes);
    if (oversizedFiles.length > 0) {
      return new Response(
        JSON.stringify({
          error: `Files exceed the ${security.security_mediaUploadMaxSizeMB} MB limit: ${oversizedFiles.map((f) => f.name).join(', ')}`,
        }),
        {
          status: 413,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate supported media types before creating a folder or writing files.
    const validTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/quicktime',
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm',
    ];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      return new Response(
        JSON.stringify({
            error: `Invalid file types. Supported formats are JPEG, PNG, GIF, WebP, MP4, WebM, MOV, MP3, WAV, and OGG. Invalid files: ${invalidFiles.map(f => f.name).join(', ')}`
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
      let savedFilePath: string | null = null;
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

        if (file.type.startsWith('image/') && shouldCompress(originalSize, file.type)) {
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
        const extensionByType: Record<string, string> = {
          'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp',
          'image/jpeg': 'jpg', 'image/jpg': 'jpg',
          'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov',
          'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 'audio/wav': 'wav',
          'audio/ogg': 'ogg', 'audio/webm': 'webm',
        };
        const fileExtension = extensionByType[file.type];
        
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
        savedFilePath = filePath;

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
      } catch (error: unknown) {
        console.error(`Error uploading file ${file.name}:`, error);
        if (savedFilePath) {
          await deleteFile(savedFilePath).catch((cleanupError) => {
            console.warn(`Could not remove incomplete upload ${savedFilePath}:`, cleanupError);
          });
        }
        results.push({
          id: '',
          url: '',
          title: file.name,
          folder: {
            id: folder.id,
            name: folder.name,
            isPrivate: folder.isPrivate,
          },
          error: error instanceof Error ? error.message : 'Failed to upload file',
        });
      }
    }

    const successful = results.filter((result) => !result.error).length;
    const failed = results.length - successful;

    return new Response(
      JSON.stringify({
        success: failed === 0,
        results,
        total: files.length,
        successful,
        failed,
      }),
      {
        status: successful === 0 ? 500 : failed > 0 ? 207 : 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return handleApiError(error, 'batch upload files', request);
  }
};
