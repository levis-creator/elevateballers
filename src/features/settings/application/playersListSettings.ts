import type { SiteSetting } from '../domain/siteSetting';

export type PlayersDefaultSort = 'Name' | 'Points per game' | 'Team' | 'Jersey number';
export type PublicPlayersListSettings = {
  eyebrow: string; title: string; totalLine: boolean; searchPlaceholder: string; perPage: number;
  sort: PlayersDefaultSort; positionFilter: boolean; teamFilter: boolean; headshots: boolean;
  emptyTitle: string; emptyBody: string; emptyBodyFiltered: string;
};

export const DEFAULT_PUBLIC_PLAYERS_LIST_SETTINGS: PublicPlayersListSettings = {
  eyebrow: 'The Players · Season {season}', title: 'Players', totalLine: true,
  searchPlaceholder: 'Search players…', perPage: 24, sort: 'Points per game', positionFilter: true, teamFilter: true, headshots: true,
  emptyTitle: 'No players found', emptyBody: 'Nothing matches “{q}”. Try another name or team.', emptyBodyFiltered: 'No players match these filters. Try clearing them.',
};

const text = (value: string | undefined, fallback: string) => value === undefined ? fallback : value.trim();
const bool = (value: string | undefined, fallback: boolean) => value === 'true' ? true : value === 'false' ? false : fallback;
const integer = (value: string | undefined, fallback: number) => { const parsed = Number(value); return Number.isFinite(parsed) ? Math.min(100, Math.max(1, Math.round(parsed))) : fallback; };

export function resolvePublicPlayersListSettings(settings: SiteSetting[]): PublicPlayersListSettings {
  const v = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
  const d = DEFAULT_PUBLIC_PLAYERS_LIST_SETTINGS;
  const sorts: PlayersDefaultSort[] = ['Name', 'Points per game', 'Team', 'Jersey number'];
  return {
    eyebrow: text(v.players_eyebrow, d.eyebrow), title: text(v.players_title, d.title), totalLine: bool(v.players_totalLine, d.totalLine),
    searchPlaceholder: text(v.players_searchPlaceholder, d.searchPlaceholder), perPage: integer(v.players_perPage, d.perPage), sort: sorts.includes(v.players_sort as PlayersDefaultSort) ? v.players_sort as PlayersDefaultSort : d.sort,
    positionFilter: bool(v.players_positionFilter, d.positionFilter), teamFilter: bool(v.players_teamFilter, d.teamFilter), headshots: bool(v.players_headshots, d.headshots),
    emptyTitle: text(v.players_emptyTitle, d.emptyTitle), emptyBody: text(v.players_emptyBody, d.emptyBody), emptyBodyFiltered: text(v.players_emptyBodyFiltered, d.emptyBodyFiltered),
  };
}

export const playersListToken = (template: string, tokens: { season?: string; q?: string }) => template.replaceAll('{season}', tokens.season || '—').replaceAll('{q}', tokens.q || '');
