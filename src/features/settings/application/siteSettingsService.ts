import type {
  CreateSiteSettingInput,
  SiteSetting,
  SiteSettingsRepository,
  UpdateSiteSettingInput,
} from '../domain/siteSetting';

const PUBLIC_CATEGORIES = new Set(['appearance']);
const PUBLIC_KEYS = new Set(['header_banner_image_url']);

export class SiteSettingsService {
  constructor(private readonly repository: SiteSettingsRepository) {}

  list(category?: string): Promise<SiteSetting[]> {
    return this.repository.findAll(category);
  }

  async listPublic(category?: string): Promise<SiteSetting[]> {
    if (category && !PUBLIC_CATEGORIES.has(category)) {
      throw new Error('Category not allowed');
    }

    const settings = await this.repository.findAll(category);
    return settings.filter((setting) => PUBLIC_KEYS.has(setting.key));
  }

  async get(identifier: string): Promise<SiteSetting | null> {
    return (await this.repository.findById(identifier)) ?? this.repository.findByKey(identifier);
  }

  create(input: CreateSiteSettingInput): Promise<SiteSetting> {
    if (!input.key?.trim() || !input.value || !input.label?.trim()) {
      throw new Error('Key, value, and label are required');
    }

    return this.repository.create({
      ...input,
      key: input.key.trim(),
      label: input.label.trim(),
    });
  }

  update(id: string, input: UpdateSiteSettingInput): Promise<SiteSetting | null> {
    return this.repository.update(id, input);
  }

  remove(id: string): Promise<boolean> {
    return this.repository.delete(id);
  }
}
