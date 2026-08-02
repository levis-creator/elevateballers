import type { SiteSetting } from '../domain/siteSetting';

export type LeadersCategorySetting = { name: string; unit: string };

export type PublicLeadersSettings = {
  eyebrow: string;
  title: string;
  categories: LeadersCategorySetting[];
  podium: boolean;
  boardRows: number;
  perGame: boolean;
  minGames: number;
  qualNote: string;
};

export const DEFAULT_PUBLIC_LEADERS_SETTINGS: PublicLeadersSettings = {
  eyebrow: 'Statistical Leaders · Season {season}',
  title: 'League Leaders',
  categories: [
    { name: 'Points', unit: 'PPG' },
    { name: 'Rebounds', unit: 'RPG' },
    { name: 'Assists', unit: 'APG' },
    { name: 'Steals', unit: 'SPG' },
    { name: 'Blocks', unit: 'BPG' },
    { name: '3-Pointers', unit: '3PG' },
  ],
  podium: true,
  boardRows: 15,
  perGame: true,
  minGames: 3,
  qualNote: 'Minimum {n} games to qualify',
};

const text = (value: string | undefined, fallback: string) => value === undefined ? fallback : value.trim();
const bool = (value: string | undefined, fallback: boolean) => value === 'true' ? true : value === 'false' ? false : fallback;
const integer = (value: string | undefined, fallback: number, min: number, max: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.round(parsed))) : fallback;
};
const list = <T>(value: string | undefined, fallback: T[]): T[] => {
  if (value === undefined) return fallback;
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed as T[] : fallback; } catch { return fallback; }
};

export function resolvePublicLeadersSettings(settings: SiteSetting[]): PublicLeadersSettings {
  const values = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
  const defaults = DEFAULT_PUBLIC_LEADERS_SETTINGS;
  const categories = list<LeadersCategorySetting>(values.leaders_categories, defaults.categories)
    .map((item) => ({ name: String(item?.name ?? '').trim(), unit: String(item?.unit ?? '').trim() }))
    .filter((item) => item.name && item.unit)
    .slice(0, 6);
  return {
    eyebrow: text(values.leaders_eyebrow, defaults.eyebrow),
    title: text(values.leaders_title, defaults.title),
    categories: categories.length ? categories : defaults.categories,
    podium: bool(values.leaders_podium, defaults.podium),
    boardRows: integer(values.leaders_boardRows, defaults.boardRows, 1, 100),
    perGame: bool(values.leaders_perGame, defaults.perGame),
    minGames: integer(values.leaders_minGames, defaults.minGames, 0, 100),
    qualNote: text(values.leaders_qualNote, defaults.qualNote),
  };
}

export const leadersToken = (template: string, value: string | number) => template
  .replaceAll('{season}', String(value))
  .replaceAll('{n}', String(value));
