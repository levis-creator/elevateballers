import { describe, expect, it, vi } from 'vitest';
import type { SiteSetting, SiteSettingsRepository } from '../../domain/siteSetting';
import { SiteSettingsService } from '../siteSettingsService';

const setting = (key: string, value: string, category: string): SiteSetting => ({
  id: key,
  key,
  value,
  type: 'text',
  label: key,
  description: null,
  category,
  createdAt: new Date(),
  updatedAt: new Date(),
});

function createRepository(rows: SiteSetting[]) {
  const repository = {
    findAll: vi.fn(async () => rows),
    findById: vi.fn(async (id: string) => rows.find((row) => row.id === id) ?? null),
    findByKey: vi.fn(async (key: string) => rows.find((row) => row.key === key) ?? null),
    create: vi.fn(async (input) => setting(input.key, input.value, input.category ?? '')),
    update: vi.fn(async (id: string, input) => ({ ...rows.find((row) => row.id === id)!, ...input })),
    delete: vi.fn(async () => true),
  } satisfies SiteSettingsRepository;
  return repository;
}

describe('SiteSettingsService snapshot', () => {
  const rows = [
    setting('brand_siteName', 'Elevate Ballers', 'brand'),
    setting('seo_metaTitle', 'Home', 'seo'),
    setting('system_maintenance', 'false', 'system'),
  ];

  it('serves several categories in one render from a single query', async () => {
    const repository = createRepository(rows);
    const service = new SiteSettingsService(repository, () => 1_000);

    const [brand, seo, all] = await Promise.all([service.list('brand'), service.list('seo'), service.list()]);

    expect(repository.findAll).toHaveBeenCalledTimes(1);
    expect(brand.map((row) => row.key)).toEqual(['brand_siteName']);
    expect(seo.map((row) => row.key)).toEqual(['seo_metaTitle']);
    expect(all).toHaveLength(3);
  });

  it('reloads after the snapshot expires', async () => {
    let now = 1_000;
    const repository = createRepository(rows);
    const service = new SiteSettingsService(repository, () => now);

    await service.list('brand');
    now += 4_999;
    await service.list('seo');
    expect(repository.findAll).toHaveBeenCalledTimes(1);
    now += 1;
    await service.list('seo');
    expect(repository.findAll).toHaveBeenCalledTimes(2);
  });

  it('reloads after a write', async () => {
    const repository = createRepository(rows);
    const service = new SiteSettingsService(repository, () => 1_000);

    await service.list();
    await service.update('seo_metaTitle', { value: 'Welcome' });
    await service.list();
    await service.remove('seo_metaTitle');
    await service.list();

    expect(repository.findAll).toHaveBeenCalledTimes(3);
  });

  it('retries after a failed load instead of caching the failure', async () => {
    const repository = createRepository(rows);
    repository.findAll.mockRejectedValueOnce(new Error('db down'));
    const service = new SiteSettingsService(repository, () => 1_000);

    await expect(service.list()).rejects.toThrow('db down');
    await expect(service.list()).resolves.toHaveLength(3);
  });

  it('does not let callers change the shared snapshot', async () => {
    const service = new SiteSettingsService(createRepository(rows), () => 1_000);

    (await service.list('brand'))[0].value = 'Changed';

    expect((await service.list('brand'))[0].value).toBe('Elevate Ballers');
  });
});
