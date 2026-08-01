import { siteSettingsService } from '../../../../settings';
import type { CreateSiteSettingInput, UpdateSiteSettingInput, SiteSetting } from '../../../../settings';

export async function createSiteSetting(data: CreateSiteSettingInput): Promise<SiteSetting> {
  return siteSettingsService.create(data);
}

export async function updateSiteSetting(
  id: string,
  data: UpdateSiteSettingInput
): Promise<SiteSetting | null> {
  return siteSettingsService.update(id, data);
}

export async function updateSiteSettingByKey(key: string, value: string): Promise<SiteSetting | null> {
  const setting = await siteSettingsService.get(key);
  return setting ? siteSettingsService.update(setting.id, { value }) : null;
}

export async function deleteSiteSetting(id: string): Promise<boolean> {
  return siteSettingsService.remove(id);
}
