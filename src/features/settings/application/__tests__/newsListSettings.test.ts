import { describe, expect, it } from 'vitest';
import type { SiteSetting } from '../../domain/siteSetting';
import { newsListToken, resolvePublicNewsListSettings } from '../newsListSettings';

const setting = (key: string, value: string): SiteSetting => ({
  id: key,
  key,
  value,
  type: 'text',
  label: key,
  description: null,
  category: 'news',
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('news list settings', () => {
  it('resolves all listing and sidebar controls', () => {
    const settings = resolvePublicNewsListSettings([
      setting('news_featured', 'false'),
      setting('news_categories', '[{"name":"Interviews"},{"name":"Analysis"}]'),
      setting('news_perPage', '12'),
      setting('news_readTime', 'false'),
      setting('news_archives', 'false'),
      setting('news_newsletterButton', 'Join now'),
    ]);

    expect(settings).toMatchObject({
      featured: false,
      categories: [{ name: 'Interviews' }, { name: 'Analysis' }],
      perPage: 12,
      readTime: false,
      archives: false,
      newsletterButton: 'Join now',
    });
  });

  it('honours an intentionally empty category list and bounds page size', () => {
    const settings = resolvePublicNewsListSettings([
      setting('news_categories', '[]'),
      setting('news_perPage', '999'),
    ]);
    expect(settings.categories).toEqual([]);
    expect(settings.perPage).toBe(48);
  });

  it('replaces the search token', () => {
    expect(newsListToken('Nothing matches “{q}”.', 'finals')).toBe('Nothing matches “finals”.');
  });
});

