import { prisma } from '../../../../../lib/prisma';
import type { PageContent } from '../../../types';

export async function getAllPageContents(): Promise<PageContent[]> {
  return await prisma.pageContent.findMany({ orderBy: { title: 'asc' } });
}

export async function getPageContentById(id: string): Promise<PageContent | null> {
  return await prisma.pageContent.findUnique({ where: { id } });
}

export async function getPageContentBySlug(slug: string): Promise<PageContent | null> {
  return await prisma.pageContent.findUnique({ where: { slug } });
}
