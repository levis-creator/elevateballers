import type { SiteSetting } from '../domain/siteSetting';
import type { PublicCompetitionOption } from '@/features/seasons/domain/entities/public-competition';

export type CompetitionNameSetting = { code: string; name: string };

export type PublicCompetitionSettings = {
  names: CompetitionNameSetting[];
  defaultLeague: string;
  allLabel: string;
  archive: boolean;
  seasonLabel: string;
  archiveYears: number;
};

export const DEFAULT_PUBLIC_COMPETITION_SETTINGS: PublicCompetitionSettings = {
  names: [
    { code: 'EBL', name: 'Elevate Ballers League (EBL)' },
    { code: 'EWBL', name: "Elevate Women's Basketball League (EWBL)" },
  ],
  defaultLeague: 'Remember last choice',
  allLabel: 'All Leagues',
  archive: true,
  seasonLabel: 'Season',
  archiveYears: 3,
};

const text = (value: string | undefined, fallback: string) => value === undefined ? fallback : value.trim();
const bool = (value: string | undefined, fallback: boolean) => value === 'true' ? true : value === 'false' ? false : fallback;
const integer = (value: string | undefined, fallback: number, min: number, max: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.round(parsed))) : fallback;
};
const list = <T>(value: string | undefined, fallback: T[]): T[] => {
  if (value === undefined) return fallback;
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) && parsed.length ? parsed as T[] : fallback; } catch { return fallback; }
};

export function resolvePublicCompetitionSettings(settings: SiteSetting[]): PublicCompetitionSettings {
  const v = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
  const d = DEFAULT_PUBLIC_COMPETITION_SETTINGS;
  const names = list<CompetitionNameSetting>(v.leagues_names, d.names)
    .map((item) => ({ code: String(item.code ?? '').trim(), name: String(item.name ?? '').trim() }))
    .filter((item) => item.code && item.name);
  return {
    names: names.length ? names : d.names,
    defaultLeague: text(v.leagues_defaultLeague, d.defaultLeague),
    allLabel: text(v.leagues_allLabel, d.allLabel),
    archive: bool(v.leagues_archive, d.archive),
    seasonLabel: text(v.leagues_seasonLabel, d.seasonLabel),
    archiveYears: integer(v.leagues_archiveYears, d.archiveYears, 1, 20),
  };
}

const normalized = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export function configuredLeagueName(source: string, settings: PublicCompetitionSettings, index = 0) {
  const key = normalized(source);
  return settings.names.find((entry) => key.includes(normalized(entry.code)) || key === normalized(entry.name))
    ?? settings.names[index];
}

function configuredLeague(item: PublicCompetitionOption, settings: PublicCompetitionSettings, leagueIndex: number) {
  return configuredLeagueName(item.leagueLabel, settings, leagueIndex);
}

export function applyCompetitionSettings(
  competitions: PublicCompetitionOption[],
  settings: PublicCompetitionSettings,
): PublicCompetitionOption[] {
  const seasons = [...new Set(competitions.map((item) => item.seasonId))];
  const allowedSeasons = new Set(seasons.slice(0, settings.archive ? settings.archiveYears : 1));
  const leagueIds = [...new Set(competitions.map((item) => item.leagueId))];
  return competitions
    .filter((item) => allowedSeasons.has(item.seasonId))
    .map((item) => {
      const configured = configuredLeague(item, settings, leagueIds.indexOf(item.leagueId));
      const baseSeason = item.seasonLabel.replace(/\s+Season$/i, '').trim();
      return {
        ...item,
        leagueLabel: configured?.name || item.leagueLabel,
        leagueCode: configured?.code || item.leagueCode,
        seasonLabel: settings.seasonLabel ? `${baseSeason} ${settings.seasonLabel}`.trim() : baseSeason,
      };
    });
}

export function configuredDefaultCompetitionId(
  competitions: PublicCompetitionOption[],
  settings: PublicCompetitionSettings,
  fallback: string,
) {
  if (settings.defaultLeague === 'Remember last choice') return fallback;
  return competitions.find((item) => item.leagueCode === settings.defaultLeague)?.id ?? fallback;
}
