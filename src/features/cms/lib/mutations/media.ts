import { prisma } from '../../../../lib/prisma';
import type { CreateMediaInput, UpdateMediaInput, MediaWithFolderAndUploader } from '../../types';

export async function createMedia(data: CreateMediaInput): Promise<MediaWithFolderAndUploader> {
  return await prisma.media.create({
    data: { ...data, tags: data.tags || [] },
    include: {
      folder: { select: { id: true, name: true, isPrivate: true } },
      uploader: { select: { id: true, name: true, email: true } },
    },
  }) as MediaWithFolderAndUploader;
}

export async function updateMedia(
  id: string,
  data: UpdateMediaInput
): Promise<MediaWithFolderAndUploader | null> {
  try {
    if ('featured' in data && typeof data.featured === 'boolean') {
      await prisma.$executeRawUnsafe(
        `UPDATE media SET featured = ? WHERE id = ?`,
        data.featured ? 1 : 0,
        id
      );
      const { featured, ...restData } = data;
      if (Object.keys(restData).length > 0) {
        await prisma.media.update({ where: { id }, data: restData });
      }
    } else {
      await prisma.media.update({ where: { id }, data });
    }

    const rows = await prisma.$queryRawUnsafe<Array<{
      id: string; title: string; url: string; file_path: string | null;
      folder_id: string | null; size: number | null; original_size: number | null;
      compression_ratio: number | null; mime_type: string | null; type: string;
      thumbnail: string | null; is_private: number; featured: number;
      uploaded_by: string | null; created_at: Date; updated_at: Date;
      folder_name: string | null; folder_is_private: number | null;
      uploader_name: string | null; uploader_email: string | null; tags: any;
    }>>(
      `SELECT m.id, m.title, m.url, m.file_path, m.folder_id, m.size, m.original_size,
        m.compression_ratio, m.mime_type, m.type, m.thumbnail, m.is_private, m.featured,
        m.uploaded_by, m.created_at, m.updated_at, m.tags,
        f.name as folder_name, f.is_private as folder_is_private,
        u.name as uploader_name, u.email as uploader_email
       FROM media m
       LEFT JOIN folders f ON m.folder_id = f.id
       LEFT JOIN users u ON m.uploaded_by = u.id
       WHERE m.id = ?`,
      id
    );

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      id: row.id, title: row.title, url: row.url, filePath: row.file_path,
      folderId: row.folder_id, size: row.size, originalSize: row.original_size,
      compressionRatio: row.compression_ratio, mimeType: row.mime_type,
      type: row.type as any, thumbnail: row.thumbnail,
      isPrivate: Boolean(row.is_private), featured: Boolean(row.featured),
      uploadedBy: row.uploaded_by, createdAt: row.created_at, updatedAt: row.updated_at,
      tags: row.tags,
      folder: row.folder_id
        ? { id: row.folder_id, name: row.folder_name || '', isPrivate: Boolean(row.folder_is_private) }
        : null,
      uploader: row.uploaded_by
        ? { id: row.uploaded_by, name: row.uploader_name || '', email: row.uploader_email || '' }
        : null,
    } as MediaWithFolderAndUploader;
  } catch (error) {
    console.error('Error updating media:', error);
    return null;
  }
}

export async function deleteMedia(id: string): Promise<boolean> {
  try {
    const media = await prisma.media.findUnique({
      where: { id },
      select: { id: true, filePath: true, url: true, title: true },
    });

    if (!media) {
      console.warn(`Media with id ${id} not found`);
      return false;
    }

    try {
      const { checkFileInUse } = await import('../../../../lib/file-usage');
      const inUse = await checkFileInUse(id);
      if (inUse) console.warn(`Media "${media.title}" (${id}) is still in use but will be deleted`);
    } catch (usageError) {
      console.warn('Could not check file usage:', usageError);
    }

    if (media.filePath) {
      try {
        const otherWithSameFile = await prisma.media.findMany({
          where: { filePath: media.filePath, id: { not: id } },
          select: { id: true, title: true },
        });

        if (otherWithSameFile.length === 0) {
          const { deleteFile } = await import('../../../../lib/file-storage');
          const deleted = await deleteFile(media.filePath);
          if (!deleted) console.warn(`File ${media.filePath} may not have existed or was already deleted`);
        } else {
          console.log(
            `Skipping file deletion for ${media.filePath} - ${otherWithSameFile.length} other record(s) reference it`
          );
        }
      } catch (fileError: any) {
        console.error('Error checking/deleting file from disk:', fileError);
      }
    }

    await prisma.media.delete({ where: { id } });

    if (media.filePath) {
      try {
        const { fileExists } = await import('../../../../lib/file-storage');
        const fileStillExists = await fileExists(media.filePath);
        if (!fileStillExists) {
          const orphaned = await prisma.media.findMany({
            where: { filePath: media.filePath },
            select: { id: true, title: true },
          });
          if (orphaned.length > 0) {
            await prisma.media.deleteMany({ where: { id: { in: orphaned.map((r) => r.id) } } });
            console.log(`[CLEANUP] Deleted ${orphaned.length} orphaned record(s) with missing file: ${media.filePath}`);
          }
        }
      } catch (cleanupError) {
        console.warn('Error cleaning up orphaned records after deletion:', cleanupError);
      }
    }

    return true;
  } catch (error) {
    console.error('Error deleting media:', error);
    return false;
  }
}
