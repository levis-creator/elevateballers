import { prisma } from '../../../../../lib/prisma';
import type { SiteSetting } from '../../../types';

export async function getAllSiteSettings(category?: string): Promise<SiteSetting[]> {
  return await prisma.siteSetting.findMany({
    where: category ? { category } : {},
    orderBy: { category: 'asc' },
  });
}

export async function getSiteSettingByKey(key: string): Promise<SiteSetting | null> {
  return await prisma.siteSetting.findUnique({ where: { key } });
}

export async function getSiteSettingsByCategory(category: string): Promise<SiteSetting[]> {
  return await prisma.siteSetting.findMany({
    where: { category },
    orderBy: { label: 'asc' },
  });
}
