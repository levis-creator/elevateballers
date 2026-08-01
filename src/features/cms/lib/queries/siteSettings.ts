import { siteSettingsService } from '../../../../settings';
import type { SiteSetting } from '../../../../settings';

export async function getAllSiteSettings(category?: string): Promise<SiteSetting[]> {
  return siteSettingsService.list(category);
}

export async function getSiteSettingByKey(key: string): Promise<SiteSetting | null> {
  return siteSettingsService.get(key);
}

export async function getSiteSettingsByCategory(category: string): Promise<SiteSetting[]> {
  return siteSettingsService.list(category);
}
