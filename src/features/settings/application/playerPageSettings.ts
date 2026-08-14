import type { SiteSetting } from '../domain/siteSetting';

export type PlayerPageLabelItem = { label: string };

export type PublicPlayerPageSettings = {
  teamChip: boolean;
  bioFacts: PlayerPageLabelItem[];
  heroAverages: PlayerPageLabelItem[];
  headshot: boolean;
  splits: boolean;
  splitsHeading: string;
  shooting: boolean;
  gameLog: boolean;
  logRows: number;
  bio: boolean;
  social: boolean;
  careerHigh: boolean;
};

export const DEFAULT_PUBLIC_PLAYER_PAGE_SETTINGS: PublicPlayerPageSettings = {
  teamChip: true,
  bioFacts: [{ label: 'Position' }, { label: 'Height' }, { label: 'Age' }, { label: 'Games' }],
  heroAverages: [{ label: 'Points' }, { label: 'Rebounds' }, { label: 'Assists' }, { label: 'Steals' }, { label: 'FG' }, { label: '3PT' }],
  headshot: true,
  splits: true,
  splitsHeading: 'Per-Game Splits',
  shooting: true,
  gameLog: true,
  logRows: 10,
  bio: true,
  social: false,
  careerHigh: true,
};

const bool = (value: string | undefined, fallback: boolean) => value === 'true' ? true : value === 'false' ? false : fallback;
const text = (value: string | undefined, fallback: string) => value === undefined ? fallback : value.trim();
const integer = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(50, Math.max(1, Math.round(parsed))) : fallback;
};
const labels = (value: string | undefined, fallback: PlayerPageLabelItem[], max: number) => {
  if (value === undefined) return fallback;
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return fallback;
    const items = parsed
      .map((item) => ({ label: String(item?.label ?? '').trim() }))
      .filter((item) => item.label)
      .slice(0, max);
    return items;
  } catch {
    return fallback;
  }
};

export function resolvePublicPlayerPageSettings(settings: SiteSetting[]): PublicPlayerPageSettings {
  const values = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
  const defaults = DEFAULT_PUBLIC_PLAYER_PAGE_SETTINGS;
  return {
    teamChip: bool(values.player_teamChip, defaults.teamChip),
    bioFacts: labels(values.player_bioFacts, defaults.bioFacts, 8),
    heroAverages: labels(values.player_heroAverages, defaults.heroAverages, 8),
    headshot: bool(values.player_headshot, defaults.headshot),
    splits: bool(values.player_splits, defaults.splits),
    splitsHeading: text(values.player_splitsHeading, defaults.splitsHeading),
    shooting: bool(values.player_shooting, defaults.shooting),
    gameLog: bool(values.player_gameLog, defaults.gameLog),
    logRows: integer(values.player_logRows, defaults.logRows),
    bio: bool(values.player_bio, defaults.bio),
    social: bool(values.player_social, defaults.social),
    careerHigh: bool(values.player_careerHigh, defaults.careerHigh),
  };
}
