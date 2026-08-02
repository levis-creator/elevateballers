import type { SiteSetting } from '../domain/siteSetting';

export type PublicFixturesSettings = {
  eyebrow: string; title: string; browseRow: boolean;
  viewTabs: boolean; leagueFilter: boolean; dayNav: boolean; horizon: number;
  venue: boolean; leagueTag: boolean; crests: boolean; ics: boolean;
  emptyTitle: string; emptyBody: string; emptyBodyFiltered: string;
};

export const DEFAULT_PUBLIC_FIXTURES_SETTINGS: PublicFixturesSettings = {
  eyebrow: 'Match Calendar · Season {season}', title: 'Fixtures', browseRow: true,
  viewTabs: true, leagueFilter: true, dayNav: true, horizon: 30,
  venue: true, leagueTag: true, crests: true, ics: true,
  emptyTitle: 'No upcoming fixtures',
  emptyBody: 'The schedule for this season hasn’t been published yet. Check back soon.',
  emptyBodyFiltered: 'No {league} fixtures are scheduled right now.',
};

const text = (value: string | undefined, fallback: string) => value === undefined ? fallback : value.trim();
const bool = (value: string | undefined, fallback: boolean) => value === 'true' ? true : value === 'false' ? false : fallback;
const integer = (value: string | undefined, fallback: number, min: number, max: number) => {
  const parsed = Number(value); return Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.round(parsed))) : fallback;
};

export function resolvePublicFixturesSettings(settings: SiteSetting[]): PublicFixturesSettings {
  const v = Object.fromEntries(settings.map((setting) => [setting.key, setting.value])); const d = DEFAULT_PUBLIC_FIXTURES_SETTINGS;
  return {
    eyebrow: text(v.fixtures_eyebrow, d.eyebrow), title: text(v.fixtures_title, d.title), browseRow: bool(v.fixtures_browseRow, d.browseRow),
    viewTabs: bool(v.fixtures_viewTabs, d.viewTabs), leagueFilter: bool(v.fixtures_leagueFilter, d.leagueFilter), dayNav: bool(v.fixtures_dayNav, d.dayNav), horizon: integer(v.fixtures_horizon, d.horizon, 1, 365),
    venue: bool(v.fixtures_venue, d.venue), leagueTag: bool(v.fixtures_leagueTag, d.leagueTag), crests: bool(v.fixtures_crests, d.crests), ics: bool(v.fixtures_ics, d.ics),
    emptyTitle: text(v.fixtures_emptyTitle ?? v.fixtures_empty, d.emptyTitle), emptyBody: text(v.fixtures_emptyBody, d.emptyBody), emptyBodyFiltered: text(v.fixtures_emptyBodyFiltered, d.emptyBodyFiltered),
  };
}

export const fixturesToken = (template: string, value: string) => template.replaceAll('{season}', value).replaceAll('{league}', value);
