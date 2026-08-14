import type {
  CreateSiteSettingInput,
  SiteSetting,
  SiteSettingsRepository,
  UpdateSiteSettingInput,
} from '../domain/siteSetting';
import { protectSensitiveSettingValue, revealSensitiveSetting } from './sensitiveSettingValues';

const PUBLIC_CATEGORIES = new Set(['appearance', 'contact', 'system']);
const PUBLIC_KEYS = new Set([
  'header_banner_image_url',
  'contact_email',
  'contact_phone',
  'contact_address',
  'contact_hours',
  'contact_departmentList',
  'contact_responseTarget',
  'social_facebook',
  'social_instagram',
  'social_youtube',
  'social_twitter',
  'social_order',
  'system_loadingLabel',
  'system_loadingLines',
  'system_splashThreshold',
  'system_skeletons',
]);

export class SiteSettingsService {
  constructor(private readonly repository: SiteSettingsRepository) {}

  async list(category?: string): Promise<SiteSetting[]> {
    return (await this.repository.findAll(category)).map(revealSensitiveSetting);
  }

  async listPublic(category?: string): Promise<SiteSetting[]> {
    if (category && !PUBLIC_CATEGORIES.has(category)) {
      throw new Error('Category not allowed');
    }

    const settings = await this.repository.findAll(category);
    return settings.filter((setting) => PUBLIC_KEYS.has(setting.key));
  }

  async get(identifier: string): Promise<SiteSetting | null> {
    const setting = (await this.repository.findById(identifier)) ?? await this.repository.findByKey(identifier);
    return setting ? revealSensitiveSetting(setting) : null;
  }

  async create(input: CreateSiteSettingInput): Promise<SiteSetting> {
    if (!input.key?.trim() || input.value == null || !input.label?.trim()) {
      throw new Error('Key, value, and label are required');
    }

    const created = await this.repository.create({
      ...input,
      key: input.key.trim(),
      value: protectSensitiveSettingValue(input.key.trim(), input.value),
      label: input.label.trim(),
    });
    return revealSensitiveSetting(created);
  }

  async update(id: string, input: UpdateSiteSettingInput): Promise<SiteSetting | null> {
    const existing = await this.repository.findById(id);
    if (!existing) return null;
    const updated = await this.repository.update(id, {
      ...input,
      ...(input.value === undefined ? {} : { value: protectSensitiveSettingValue(existing.key, input.value, existing.value) }),
    });
    return updated ? revealSensitiveSetting(updated) : null;
  }

  remove(id: string): Promise<boolean> {
    return this.repository.delete(id);
  }
}
