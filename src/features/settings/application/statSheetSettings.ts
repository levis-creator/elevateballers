import type { SiteSetting } from '../domain/siteSetting';

/** Options for the downloadable match stat sheet PDF (Match Page settings). */
export type StatSheetSettings = {
  /** Logo printed on the sheet; empty means use the header logo. */
  logo: string;
  comparison: boolean;
  shooting: boolean;
  boxScores: boolean;
  minutes: boolean;
  watermark: boolean;
  /** Short line printed above the footer on every page, e.g. an official-result note. */
  footerNote: string;
};

export const DEFAULT_STAT_SHEET_SETTINGS: StatSheetSettings = {
  logo: '',
  comparison: true,
  shooting: true,
  boxScores: true,
  minutes: true,
  watermark: true,
  footerNote: '',
};

const bool = (value: string | undefined, fallback: boolean) => (value === 'true' ? true : value === 'false' ? false : fallback);

function assetPath(value: string | undefined): string {
  const path = value?.trim();
  if (!path) return '';
  if (/^(https?:)?\/\//.test(path) || path.startsWith('/')) return path;
  return `/${path}`;
}

export function resolveStatSheetSettings(settings: SiteSetting[]): StatSheetSettings {
  const values = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
  const d = DEFAULT_STAT_SHEET_SETTINGS;
  return {
    logo: assetPath(values.match_sheetLogo),
    comparison: bool(values.match_sheetComparison, d.comparison),
    shooting: bool(values.match_sheetShooting, d.shooting),
    boxScores: bool(values.match_sheetBoxScores, d.boxScores),
    minutes: bool(values.match_sheetMinutes, d.minutes),
    watermark: bool(values.match_sheetWatermark, d.watermark),
    footerNote: (values.match_sheetFooterNote ?? '').trim().slice(0, 160),
  };
}
