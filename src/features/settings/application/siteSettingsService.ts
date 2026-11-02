import type {
  CreateSiteSettingInput,
  SiteSetting,
  SiteSettingsRepository,
  UpdateSiteSettingInput,
} from '../domain/siteSetting';
import { protectSensitiveSettingValue, revealSensitiveSetting } from './sensitiveSettingValues';
import {
  isSecuritySettingKey,
  isSecurityBooleanSettingKey,
  isSecuritySecretSettingKey,
  normalizeSecuritySettingValue,
} from './securitySettings';

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

// One page render asks for several categories (layout, header, page body).
// Loading the whole table once and reusing it briefly turns those into a single
// query. Writes in this process clear it; other processes catch up within the TTL.
const SNAPSHOT_TTL_MS = 5_000;

export class SiteSettingsService {
  private snapshot: { loadedAt: number; settings: Promise<SiteSetting[]> } | null = null;

  constructor(
    private readonly repository: SiteSettingsRepository,
    private readonly now: () => number = Date.now,
  ) {}

  async list(category?: string): Promise<SiteSetting[]> {
    return (await this.findAll(category)).map((setting) => revealSensitiveSetting({ ...setting }));
  }

  async listPublic(category?: string): Promise<SiteSetting[]> {
    if (category && !PUBLIC_CATEGORIES.has(category)) {
      throw new Error('Category not allowed');
    }

    const settings = await this.findAll(category);
    return settings.filter((setting) => PUBLIC_KEYS.has(setting.key)).map((setting) => ({ ...setting }));
  }

  private async findAll(category?: string): Promise<SiteSetting[]> {
    const now = this.now();
    if (!this.snapshot || now - this.snapshot.loadedAt >= SNAPSHOT_TTL_MS) {
      const settings = this.repository.findAll();
      const snapshot = { loadedAt: now, settings };
      this.snapshot = snapshot;
      settings.catch(() => {
        if (this.snapshot === snapshot) this.snapshot = null;
      });
    }
    const settings = await this.snapshot.settings;
    return category ? settings.filter((setting) => setting.category === category) : settings;
  }

  invalidate(): void {
    this.snapshot = null;
  }

  async get(identifier: string): Promise<SiteSetting | null> {
    const setting = (await this.repository.findById(identifier)) ?? await this.repository.findByKey(identifier);
    return setting ? revealSensitiveSetting(setting) : null;
  }

  async create(input: CreateSiteSettingInput): Promise<SiteSetting> {
    if (!input.key?.trim() || input.value == null || !input.label?.trim()) {
      throw new Error('Key, value, and label are required');
    }

    const key = input.key.trim();
    if (key.startsWith('security_')) {
      if (!isSecuritySettingKey(key)) throw new Error('Unknown security setting');
      const value = normalizeSecuritySettingValue(key, input.value);
      if (value === null) throw new Error('Security setting value is outside the permitted range');
      input = {
        ...input,
        key,
        value,
        type: isSecurityBooleanSettingKey(key) ? 'toggle' : isSecuritySecretSettingKey(key) ? 'text' : 'number',
        category: 'security',
      };
    }

    const created = await this.repository.create({
      ...input,
      key,
      value: protectSensitiveSettingValue(key, input.value),
      label: input.label.trim(),
    });
    this.invalidate();
    return revealSensitiveSetting(created);
  }

  async update(id: string, input: UpdateSiteSettingInput): Promise<SiteSetting | null> {
    const existing = await this.repository.findById(id);
    if (!existing) return null;
    if (isSecuritySettingKey(existing.key)) {
      input = { ...input, type: isSecurityBooleanSettingKey(existing.key) ? 'toggle' : isSecuritySecretSettingKey(existing.key) ? 'text' : 'number', category: 'security' };
      if (input.value !== undefined) {
        const value = normalizeSecuritySettingValue(existing.key, input.value);
        if (value === null) throw new Error('Security setting value is outside the permitted range');
        input = { ...input, value };
      }
    }
    const updated = await this.repository.update(id, {
      ...input,
      ...(input.value === undefined ? {} : { value: protectSensitiveSettingValue(existing.key, input.value, existing.value) }),
    });
    this.invalidate();
    return updated ? revealSensitiveSetting(updated) : null;
  }

  async remove(id: string): Promise<boolean> {
    const removed = await this.repository.delete(id);
    this.invalidate();
    return removed;
  }
}
