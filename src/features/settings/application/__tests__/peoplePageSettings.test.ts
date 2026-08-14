import { describe, expect, it } from 'vitest';
import type { SiteSetting } from '../../domain/siteSetting';
import { resolvePublicPlayerPageSettings } from '../playerPageSettings';
import { resolvePublicStaffPageSettings } from '../staffPageSettings';
import { resolvePublicStaffProfileSettings } from '../staffProfileSettings';

const setting = (key: string, value: string): SiteSetting => ({
  id: key,
  key,
  value,
  type: 'text',
  label: key,
  description: null,
  category: key.split('_')[0],
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('people page settings', () => {
  it('resolves player ordering, visibility, and bounded log rows', () => {
    const settings = resolvePublicPlayerPageSettings([
      setting('player_bioFacts', '[{"label":"Games"},{"label":"Position"}]'),
      setting('player_headshot', 'false'),
      setting('player_splitsHeading', 'Season splits'),
      setting('player_logRows', '999'),
    ]);

    expect(settings.bioFacts).toEqual([{ label: 'Games' }, { label: 'Position' }]);
    expect(settings.headshot).toBe(false);
    expect(settings.splitsHeading).toBe('Season splits');
    expect(settings.logRows).toBe(50);
  });

  it('honours an intentionally empty configurable list', () => {
    expect(resolvePublicPlayerPageSettings([setting('player_bioFacts', '[]')]).bioFacts).toEqual([]);
    expect(resolvePublicStaffPageSettings([setting('staff_departments', '[]')]).departments).toEqual([]);
  });

  it('resolves Staff directory grouping, ordering, and recruitment copy', () => {
    const settings = resolvePublicStaffPageSettings([
      setting('staff_groupByRole', 'false'),
      setting('staff_departments', '[{"name":"Officiating"},{"name":"League Management"}]'),
      setting('staff_recruitHeading', 'Join match day'),
    ]);

    expect(settings.groupByRole).toBe(false);
    expect(settings.departments).toEqual([{ name: 'Officiating' }, { name: 'League Management' }]);
    expect(settings.recruitHeading).toBe('Join match day');
  });

  it('resolves every Staff Profile presentation control', () => {
    const settings = resolvePublicStaffProfileSettings([
      setting('staffMember_roleEyebrow', 'false'),
      setting('staffMember_contactButtons', 'false'),
      setting('staffMember_aboutHeading', 'Biography'),
      setting('staffMember_backLink', 'Meet the team'),
    ]);

    expect(settings).toMatchObject({
      roleEyebrow: false,
      contactButtons: false,
      aboutHeading: 'Biography',
      backLink: 'Meet the team',
    });
  });
});
