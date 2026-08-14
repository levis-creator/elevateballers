import { describe, expect, it } from 'vitest';
import type { SiteSetting } from '../../domain/siteSetting';
import { resolvePublicArticlePageSettings } from '../articlePageSettings';
import { resolvePublicPlayerOfTheWeekSettings } from '../playerOfTheWeekSettings';

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

describe('article page settings', () => {
  it('resolves visibility, copy, targets, moderation, and replies', () => {
    const settings = resolvePublicArticlePageSettings([
      setting('article_categoryChip', 'false', 'article'),
      setting('article_shareTargets', '[{"name":"X"},{"name":"in"}]', 'article'),
      setting('article_commentsHeading', 'Discussion', 'article'),
      setting('article_moderation', 'Publish immediately', 'article'),
      setting('article_replies', 'false', 'article'),
    ]);
    expect(settings).toMatchObject({
      categoryChip: false,
      shareTargets: [{ name: 'X' }, { name: 'in' }],
      commentsHeading: 'Discussion',
      moderation: 'Publish immediately',
      replies: false,
    });
  });

  it('allows an intentionally empty share-target list', () => {
    expect(resolvePublicArticlePageSettings([
      setting('article_shareTargets', '[]', 'article'),
    ]).shareTargets).toEqual([]);
  });
});

describe('player of the week settings', () => {
  it('resolves feature, stat, schedule, and profile controls', () => {
    const settings = resolvePublicPlayerOfTheWeekSettings([
      setting('potw_photo', 'false', 'potw'),
      setting('potw_stats', '[{"label":"Assists"},{"label":"Points"}]', 'potw'),
      setting('potw_day', 'Wednesday', 'potw'),
      setting('potw_archive', 'true', 'potw'),
      setting('potw_profileLink', 'true', 'potw'),
    ]);
    expect(settings).toMatchObject({
      photo: false,
      stats: [{ label: 'Assists' }, { label: 'Points' }],
      day: 'Wednesday',
      archive: true,
      profileLink: true,
    });
  });
});
