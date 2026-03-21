import { prisma } from '../../../../../lib/prisma';
import type { CreatePageContentInput, UpdatePageContentInput, PageContent } from '../../../types';

export async function createPageContent(data: CreatePageContentInput): Promise<PageContent> {
  return await prisma.pageContent.create({ data });
}

export async function updatePageContent(
  id: string,
  data: UpdatePageContentInput
): Promise<PageContent | null> {
  try {
    return await prisma.pageContent.update({ where: { id }, data });
  } catch (error) {
    console.error('Error updating page content:', error);
    return null;
  }
}

export async function deletePageContent(id: string): Promise<boolean> {
  try {
    await prisma.pageContent.delete({ where: { id } });
    return true;
  } catch (error) {
    console.error('Error deleting page content:', error);
    return false;
  }
}
