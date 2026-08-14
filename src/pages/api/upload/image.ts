import type { APIRoute } from 'astro';
import { randomBytes } from 'node:crypto';
import { prisma } from '../../../lib/prisma';
import { saveFile, sanitizeFolderName } from '../../../lib/file-storage';
import {
  compressImage,
  shouldCompress,
  validateImageBuffer,
  type CompressionResult,
} from '../../../lib/image-compression';
import { getFolderByName } from '../../../lib/folder-access';
import { requirePermission } from '@/features/rbac/middleware';
import { handleApiError } from '../../../lib/apiError';

export const prerender = false;
const MAX_UPLOAD_BODY_BYTES = 12 * 1024 * 1024;

async function readBoundedBody(request: Request, maxBytes: number): Promise<Uint8Array> {
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new Error('Upload exceeds the 12 MB request limit.');
    }
    chunks.push(value);
  }
  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // Require admin authentication
    const user = await requirePermission(request, 'media:create');

    const contentLength = Number(request.headers.get('content-length'));
    if (Number.isFinite(contentLength) && contentLength > MAX_UPLOAD_BODY_BYTES) {
      return new Response(JSON.stringify({ error: 'Upload exceeds the 12 MB request limit.' }), {
        status: 413,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    let boundedBody: Uint8Array;
    try {
      boundedBody = await readBoundedBody(request, MAX_UPLOAD_BODY_BYTES);
    } catch (error) {
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Upload is too large.',
      }), { status: 413, headers: { 'Content-Type': 'application/json' } });
    }
    const boundedRequest = new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body: boundedBody.length > 0 ? new Blob([boundedBody]) : undefined,
    });
    const formData = await boundedRequest.formData();
    const fileValue = formData.get('file');
    if (!fileValue || typeof fileValue === 'string') {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const file = fileValue as File;
    const folderName = (formData.get('folder') as string) || 'general';
    const isPrivate = formData.get('isPrivate') === 'true' || formData.get('isPrivate') === '1';
    const title = (formData.get('title') as string) || file.name || 'uploaded-image';
    const tagsParam = formData.get('tags') as string | null;
    let tags: string[] | null = null;
    if (tagsParam) {
      try {
        tags = JSON.parse(tagsParam);
      } catch {
        // If parsing fails, ignore tags
      }
    }

    // Validate the declared type before reading the body, then validate the
    // actual bytes below. File.type is browser-controlled and is not trusted.
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
    
    // Read the existing folder before validation; mutations happen only after
    // the actual image bytes have passed validation.
    let folder = await getFolderByName(sanitizedFolderName);

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const originalBuffer = Buffer.from(arrayBuffer);
    const originalSize = originalBuffer.length;
    let inspectedImage;
    try {
      inspectedImage = await validateImageBuffer(originalBuffer);
    } catch (error) {
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Invalid image content.',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    const declaredMimeType = file.type === 'image/jpg' ? 'image/jpeg' : file.type;
    if (declaredMimeType !== inspectedImage.mimeType) {
      return new Response(JSON.stringify({ error: 'The file content does not match its declared type.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const uploadMimeType = inspectedImage.mimeType;

    // Compress image if needed
    let finalBuffer = originalBuffer;
    let compressionResult: CompressionResult = {
      buffer: originalBuffer,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 0,
    };

    if (shouldCompress(originalSize, uploadMimeType) && uploadMimeType !== 'image/gif') {
      try {
        compressionResult = await compressImage(originalBuffer, {
          maxWidthOrHeight: 1920,
          quality: 0.8,
          mimeType: uploadMimeType,
        });
        finalBuffer = compressionResult.buffer;
      } catch (error) {
        console.warn('Image compression failed, using original:', error);
        // Continue with original buffer if compression fails
      }
    }

    if (!folder) {
      const folderPath = `${isPrivate ? 'private' : 'public'}/${sanitizedFolderName}`;
      folder = await prisma.folder.create({
        data: { name: sanitizedFolderName, path: folderPath, isPrivate, createdBy: user.id },
      });
    } else if (folder.isPrivate !== isPrivate) {
      const newPath = `${isPrivate ? 'private' : 'public'}/${sanitizedFolderName}`;
      folder = await prisma.folder.update({
        where: { id: folder.id },
        data: { isPrivate, path: newPath },
      });
    }

    // Determine file extension from MIME type or original filename
    let fileExtension = 'jpg'; // default
    if (uploadMimeType === 'image/png') fileExtension = 'png';
    else if (uploadMimeType === 'image/gif') fileExtension = 'gif';
    else if (uploadMimeType === 'image/webp') fileExtension = 'webp';
    
    // Generate filename with correct extension
    const timestamp = Date.now();
    const randomStr = randomBytes(8).toString('hex');
    const fileName = `${timestamp}-${randomStr}.${fileExtension}`;

    // Save file to local storage with proper extension
    const { filePath, publicUrl } = await saveFile(
      sanitizedFolderName,
      finalBuffer,
      folder.isPrivate,
      fileName
    );

    // Determine media type
    const mediaType = 'IMAGE';

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
        mimeType: uploadMimeType,
        isPrivate: folder.isPrivate,
        uploadedBy: user.id,
        tags: tags ?? undefined,
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
