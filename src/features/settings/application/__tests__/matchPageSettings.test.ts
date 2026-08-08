import { describe, expect, it } from 'vitest';
import type { SiteSetting } from '../../domain/siteSetting';
import {
  canViewMatchBoxScore,
  resolvePublicMatchPageSettings,
} from '../matchPageSettings';

const setting = (key: string, value: string): SiteSetting => ({
  id: key,
  key,
  value,
  type: 'text',
  label: key,
  description: null,
  category: 'match',
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('match page settings', () => {
  it('resolves live publication and display controls', () => {
    const settings = resolvePublicMatchPageSettings([
      setting('match_autoPublish', 'true'),
      setting('match_delay', '45'),
      setting('match_video', 'false'),
      setting('match_liveBadge', 'COURTSIDE'),
    ]);

    expect(settings).toMatchObject({
      autoPublish: true,
      delay: 45,
      video: false,
      liveBadge: 'COURTSIDE',
    });
  });

  it('enforces all box-score visibility levels', () => {
    expect(canViewMatchBoxScore('Public', false, false)).toBe(true);
    expect(canViewMatchBoxScore('Signed-in users', false, false)).toBe(false);
    expect(canViewMatchBoxScore('Signed-in users', true, false)).toBe(true);
    expect(canViewMatchBoxScore('Staff only', true, false)).toBe(false);
    expect(canViewMatchBoxScore('Staff only', true, true)).toBe(true);
  });
});
