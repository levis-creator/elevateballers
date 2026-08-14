import type { SiteSetting } from '../domain/siteSetting';

export type PotwPublicationDay = 'Monday' | 'Tuesday' | 'Wednesday';
export type PotwStatSetting = { label: string };

export type PublicPlayerOfTheWeekSettings = {
  eyebrow: string;
  photo: boolean;
  teamChip: boolean;
  tagline: boolean;
  quote: boolean;
  showStats: boolean;
  stats: PotwStatSetting[];
  day: PotwPublicationDay;
  archive: boolean;
  profileLink: boolean;
};

export const DEFAULT_PUBLIC_PLAYER_OF_THE_WEEK_SETTINGS: PublicPlayerOfTheWeekSettings = {
  eyebrow: 'Player of the Week',
  photo: true,
  teamChip: true,
  tagline: true,
  quote: true,
  showStats: true,
  stats: [{ label: 'Points' }, { label: 'Threes' }, { label: 'Assists' }],
  day: 'Monday',
  archive: false,
  profileLink: false,
};

const bool = (value: string | undefined, fallback: boolean) => value === 'true' ? true : value === 'false' ? false : fallback;
const text = (value: string | undefined, fallback: string) => value === undefined ? fallback : value.trim();
const stats = (value: string | undefined, fallback: PotwStatSetting[]) => {
  if (value === undefined) return fallback;
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return fallback;
    return parsed.map((item) => ({ label: String(item?.label ?? '').trim() })).filter((item) => item.label).slice(0, 8);
  } catch {
    return fallback;
  }
};

export function resolvePublicPlayerOfTheWeekSettings(settings: SiteSetting[]): PublicPlayerOfTheWeekSettings {
  const values = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
  const defaults = DEFAULT_PUBLIC_PLAYER_OF_THE_WEEK_SETTINGS;
  const day = text(values.potw_day, defaults.day);
  return {
    eyebrow: text(values.potw_eyebrow, defaults.eyebrow),
    photo: bool(values.potw_photo, defaults.photo),
    teamChip: bool(values.potw_teamChip, defaults.teamChip),
    tagline: bool(values.potw_tagline, defaults.tagline),
    quote: bool(values.potw_quote, defaults.quote),
    showStats: bool(values.potw_showStats, defaults.showStats),
    stats: stats(values.potw_stats, defaults.stats),
    day: ['Monday', 'Tuesday', 'Wednesday'].includes(day) ? day as PotwPublicationDay : defaults.day,
    archive: bool(values.potw_archive, defaults.archive),
    profileLink: bool(values.potw_profileLink, defaults.profileLink),
  };
}
