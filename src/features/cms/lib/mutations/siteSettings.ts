import { prisma } from '../../../../lib/prisma';
import type { CreateSiteSettingInput, UpdateSiteSettingInput, SiteSetting } from '../../types';

export async function createSiteSetting(data: CreateSiteSettingInput): Promise<SiteSetting> {
  return await prisma.siteSetting.create({ data });
}

export async function updateSiteSetting(
  id: string,
  data: UpdateSiteSettingInput
): Promise<SiteSetting | null> {
  try {
    return await prisma.siteSetting.update({ where: { id }, data });
  } catch (error) {
    console.error('Error updating site setting:', error);
    return null;
  }
}

export async function updateSiteSettingByKey(key: string, value: string): Promise<SiteSetting | null> {
  try {
    return await prisma.siteSetting.update({ where: { key }, data: { value } });
  } catch (error) {
    console.error('Error updating site setting by key:', error);
    return null;
  }
}

export async function deleteSiteSetting(id: string): Promise<boolean> {
  try {
    await prisma.siteSetting.delete({ where: { id } });
    return true;
  } catch (error) {
    console.error('Error deleting site setting:', error);
    return false;
  }
}
