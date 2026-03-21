import { prisma } from '../../../../lib/prisma';
import type { FolderWithMediaCount } from '../../types';

export async function getFolders(includePrivate = false): Promise<FolderWithMediaCount[]> {
  return await prisma.folder.findMany({
    where: includePrivate ? {} : { isPrivate: false },
    include: { _count: { select: { media: true } } },
    orderBy: { name: 'asc' },
  }) as FolderWithMediaCount[];
}

export async function getFolderById(id: string): Promise<FolderWithMediaCount | null> {
  return await prisma.folder.findUnique({
    where: { id },
    include: { _count: { select: { media: true } } },
  }) as FolderWithMediaCount | null;
}

export async function getFolderByName(name: string): Promise<FolderWithMediaCount | null> {
  return await prisma.folder.findUnique({
    where: { name },
    include: { _count: { select: { media: true } } },
  }) as FolderWithMediaCount | null;
}
