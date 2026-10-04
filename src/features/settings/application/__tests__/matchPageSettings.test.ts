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

  it('defaults the lineup deadline to 2 hours and clamps it to 0–48', () => {
    expect(resolvePublicMatchPageSettings([]).lineupDeadlineHours).toBe(2);
    expect(resolvePublicMatchPageSettings([setting('match_lineupDeadlineHours', '0')]).lineupDeadlineHours).toBe(0);
    expect(resolvePublicMatchPageSettings([setting('match_lineupDeadlineHours', '3')]).lineupDeadlineHours).toBe(3);
    expect(resolvePublicMatchPageSettings([setting('match_lineupDeadlineHours', '500')]).lineupDeadlineHours).toBe(48);
    expect(resolvePublicMatchPageSettings([setting('match_lineupDeadlineHours', '-1')]).lineupDeadlineHours).toBe(0);
    expect(resolvePublicMatchPageSettings([setting('match_lineupDeadlineHours', 'soon')]).lineupDeadlineHours).toBe(2);
  });

  it('enforces all box-score visibility levels', () => {
    expect(canViewMatchBoxScore('Public', false, false)).toBe(true);
    expect(canViewMatchBoxScore('Signed-in users', false, false)).toBe(false);
    expect(canViewMatchBoxScore('Signed-in users', true, false)).toBe(true);
    expect(canViewMatchBoxScore('Staff only', true, false)).toBe(false);
    expect(canViewMatchBoxScore('Staff only', true, true)).toBe(true);
  });
});
