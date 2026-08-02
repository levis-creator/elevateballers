import type { SiteSetting } from '../domain/siteSetting';

export type StandingsColumnSetting = { code: string; name: string };
export type PublicStandingsSettings = {
  eyebrow: string; title: string; columns: StandingsColumnSetting[];
  legend: boolean; search: boolean; tiebreak: string;
  podium: boolean; conferenceRace: boolean; raceHeading: string; conferenceTabs: boolean;
  playoffLine: boolean; playoffSpots: number; cutLabel: string;
};

export const DEFAULT_PUBLIC_STANDINGS_SETTINGS: PublicStandingsSettings = {
  eyebrow: 'League Table · Season {season}', title: 'Standings',
  columns: [
    { code: 'P', name: 'Played' }, { code: 'W', name: 'Won' }, { code: 'D', name: 'Drawn' },
    { code: 'L', name: 'Lost' }, { code: 'PF', name: 'Points For' }, { code: 'PA', name: 'Points Against' },
    { code: 'Diff', name: 'Differential' }, { code: 'Pts', name: 'Table Points' },
  ],
  legend: true, search: true, tiebreak: 'Ties are broken by point differential, then points scored.',
  podium: true, conferenceRace: true, raceHeading: 'Conference Race', conferenceTabs: true,
  playoffLine: true, playoffSpots: 8, cutLabel: 'Playoff cutoff · Top {n}',
};

const text = (value: string | undefined, fallback: string) => value === undefined ? fallback : value.trim();
const bool = (value: string | undefined, fallback: boolean) => value === 'true' ? true : value === 'false' ? false : fallback;
const integer = (value: string | undefined, fallback: number, min: number, max: number) => {
  const parsed = Number(value); return Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.round(parsed))) : fallback;
};
const list = <T>(value: string | undefined, fallback: T[]): T[] => {
  if (value === undefined) return fallback;
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) && parsed.length ? parsed as T[] : fallback; } catch { return fallback; }
};

export function resolvePublicStandingsSettings(settings: SiteSetting[]): PublicStandingsSettings {
  const v = Object.fromEntries(settings.map((setting) => [setting.key, setting.value])); const d = DEFAULT_PUBLIC_STANDINGS_SETTINGS;
  const columns = list<StandingsColumnSetting>(v.standings_columns, d.columns)
    .map((item) => ({ code: String(item.code ?? '').trim(), name: String(item.name ?? '').trim() }))
    .filter((item) => item.code && item.name);
  return {
    eyebrow: text(v.standings_eyebrow, d.eyebrow), title: text(v.standings_title, d.title), columns: columns.length ? columns : d.columns,
    legend: bool(v.standings_legend, d.legend), search: bool(v.standings_search, d.search), tiebreak: text(v.standings_tiebreak, d.tiebreak),
    podium: bool(v.standings_podium, d.podium), conferenceRace: bool(v.standings_conferenceRace, d.conferenceRace), raceHeading: text(v.standings_raceHeading, d.raceHeading), conferenceTabs: bool(v.standings_conferenceTabs, d.conferenceTabs),
    playoffLine: bool(v.standings_playoffLine, d.playoffLine), playoffSpots: integer(v.standings_playoffSpots, d.playoffSpots, 1, 64), cutLabel: text(v.standings_cutLabel, d.cutLabel),
  };
}

export const standingsEyebrow = (template: string, season: string) => template.replaceAll('{season}', season);
export const standingsCutLabel = (template: string, spots: number) => template.replaceAll('{n}', String(spots));
