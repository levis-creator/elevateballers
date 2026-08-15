import { prisma } from '../../../../../lib/prisma';
import { deleteR2Prefix, ensureR2Prefix, moveR2Prefix, isR2Configured } from '../../../../../lib/r2';
import { getFileUrl, getStorageTypeForUrl } from '../../../../../lib/file-storage';
import type { CreateFolderInput, UpdateFolderInput, Folder } from '../../../types';

export async function createFolder(data: CreateFolderInput, createdBy?: string): Promise<Folder> {
  const { name, description, isPrivate = false } = data;

  const sanitizedName = name
    .replace(/\.\./g, '')
    .replace(/[^a-zA-Z0-9\-_/]/g, '')
    .replace(/\/+/g, '/')
    .replace(/^\/|\/$/g, '');

  const path = `${isPrivate ? 'private' : 'public'}/${sanitizedName}`;

  const folder = await prisma.folder.create({
    data: { name: sanitizedName, path, description, isPrivate, createdBy: createdBy || null },
  });
  if (await isR2Configured()) await ensureR2Prefix(path);
  return folder;
}

export async function updateFolder(id: string, data: UpdateFolderInput): Promise<Folder | null> {
  try {
    const existing = await prisma.folder.findUnique({ where: { id } });
    if (!existing) return null;

    const updateData: any = {};

    if (data.name !== undefined) {
      updateData.name = data.name
        .replace(/\.\./g, '')
        .replace(/[^a-zA-Z0-9\-_/]/g, '')
        .replace(/\/+/g, '/')
        .replace(/^\/|\/$/g, '');
    }

    if (data.description !== undefined) updateData.description = data.description;

    if (data.isPrivate !== undefined) {
      updateData.isPrivate = data.isPrivate;
      updateData.path = `${data.isPrivate ? 'private' : 'public'}/${updateData.name || existing.name}`;
    } else if (updateData.name) {
      updateData.path = `${existing.isPrivate ? 'private' : 'public'}/${updateData.name}`;
    }

    const updatedPath = updateData.path as string | undefined;
    const pathChanged = Boolean(updatedPath && updatedPath !== existing.path);
    const r2Available = pathChanged && await isR2Configured();

    if (r2Available && updatedPath) {
      await moveR2Prefix(existing.path, updatedPath);

      const r2Media = await prisma.media.findMany({
        where: {
          folderId: id,
          filePath: { not: null },
          NOT: { url: { contains: 'supabase' } },
        },
        select: { id: true, filePath: true, url: true, thumbnail: true },
      });
      for (const media of r2Media) {
        if (!media.filePath) continue;
        const relativeKey = media.filePath.replace(/^uploads\//, '').split('/').slice(2).join('/');
        const filePath = `uploads/${updatedPath}/${relativeKey}`;
        await prisma.media.update({
          where: { id: media.id },
          data: {
            filePath,
            url: await getFileUrl(filePath, false),
            ...(media.thumbnail && getStorageTypeForUrl(media.url) === 'r2'
              ? { thumbnail: await getFileUrl(filePath, false) }
              : {}),
          },
        });
      }
    }

    return await prisma.folder.update({ where: { id }, data: updateData });
  } catch (error) {
    console.error('Error updating folder:', error);
    return null;
  }
}

export async function deleteFolder(id: string): Promise<boolean> {
  try {
    const folder = await prisma.folder.findUnique({ where: { id }, include: { media: { select: { id: true } } } });
    if (!folder || folder.media.length > 0) return false;
    if (await isR2Configured()) await deleteR2Prefix(folder.path);
    await prisma.folder.delete({ where: { id } });
    return true;
  } catch (error) {
    console.error('Error deleting folder:', error);
    return false;
  }
}
