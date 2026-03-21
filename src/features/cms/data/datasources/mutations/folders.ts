import { prisma } from '../../../../../lib/prisma';
import type { CreateFolderInput, UpdateFolderInput, Folder } from '../../../types';

export async function createFolder(data: CreateFolderInput, createdBy?: string): Promise<Folder> {
  const { name, description, isPrivate = false } = data;

  const sanitizedName = name
    .replace(/\.\./g, '')
    .replace(/[^a-zA-Z0-9\-_/]/g, '')
    .replace(/\/+/g, '/')
    .replace(/^\/|\/$/g, '');

  const path = `${isPrivate ? 'private' : 'public'}/${sanitizedName}`;

  return await prisma.folder.create({
    data: { name: sanitizedName, path, description, isPrivate, createdBy: createdBy || null },
  });
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

    return await prisma.folder.update({ where: { id }, data: updateData });
  } catch (error) {
    console.error('Error updating folder:', error);
    return null;
  }
}

export async function deleteFolder(id: string): Promise<boolean> {
  try {
    await prisma.folder.delete({ where: { id } });
    return true;
  } catch (error) {
    console.error('Error deleting folder:', error);
    return false;
  }
}
