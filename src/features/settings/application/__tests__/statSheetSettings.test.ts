import { describe, expect, it } from 'vitest';
import type { SiteSetting } from '../../domain/siteSetting';
import { DEFAULT_STAT_SHEET_SETTINGS, resolveStatSheetSettings } from '../statSheetSettings';

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

describe('stat sheet settings', () => {
  it('defaults to everything on, no logo override and no footer note', () => {
    expect(resolveStatSheetSettings([])).toEqual(DEFAULT_STAT_SHEET_SETTINGS);
  });

  it('reads toggles, the logo path and the footer note', () => {
    const s = resolveStatSheetSettings([
      setting('match_sheetLogo', 'media/print-logo.png'),
      setting('match_sheetShooting', 'false'),
      setting('match_sheetMinutes', 'false'),
      setting('match_sheetWatermark', 'false'),
      setting('match_sheetFooterNote', '  Official result  '),
    ]);
    expect(s).toMatchObject({
      logo: '/media/print-logo.png',
      comparison: true,
      shooting: false,
      minutes: false,
      watermark: false,
      footerNote: 'Official result',
    });
  });

  it('keeps absolute logo URLs and caps the footer note', () => {
    const s = resolveStatSheetSettings([
      setting('match_sheetLogo', 'https://cdn.example.com/logo.png'),
      setting('match_sheetFooterNote', 'x'.repeat(300)),
    ]);
    expect(s.logo).toBe('https://cdn.example.com/logo.png');
    expect(s.footerNote).toHaveLength(160);
  });
});
