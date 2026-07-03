/**
 * Server-side loader for the public playoffs pages. Pulls the season, its
 * participating teams, and its bracket-stage matches, then hands them to the
 * pure view-model builder. Keeps the Astro frontmatter thin.
 *
 * Two data shapes are supported for leagues:
 *  - a single season attached to several leagues (filter within the season via
 *    a ?league= query param), and
 *  - several same-named seasons, one league each (switch between those seasons).
 * Both are surfaced through the same league dropdown.
 */
import {
  getSeasons,
  getSeasonBySlug,
} from '../../../cms/data/datasources/queries/seasons';
import { getSeasonTeams } from '../../../cms/data/datasources/queries/seasonTeams';
import type { League, SeasonWithCounts } from '../../../cms/types';
import {
  buildPlayoffViewModel,
  type PlayoffViewModel,
} from '../../domain/usecases/playoff-view-model';
import type { SeasonOption } from '../../presentation/components/SeasonSelector';
import type { LeagueOption } from '../../presentation/components/LeagueSelector';
import {
  getPlayoffMatchesBySeason,
  getPlayoffLeagueIdsBySeason,
  getSeasonIdsWithPlayoffs,
} from './playoffQueries';

/** Sentinel league value meaning "show every league in the season". */
export const ALL_LEAGUES = 'all';

export interface PlayoffPageData {
  season: SeasonWithCounts;
  seasons: SeasonOption[];
  leagues: LeagueOption[];
  currentLeagueValue: string;
  /** Name of the league currently shown, or null when showing all leagues. */
  currentLeagueName: string | null;
  viewModel: PlayoffViewModel;
}

/** The leagues attached to a season that actually have a bracket. */
async function playoffLeaguesOf(season: SeasonWithCounts): Promise<League[]> {
  const idsWithPlayoffs = new Set(await getPlayoffLeagueIdsBySeason(season.id));
  return season.leagueSeasons.map((ls) => ls.league).filter((l) => idsWithPlayoffs.has(l.id));
}

/**
 * Season dropdown options, de-duplicated by name so several same-named seasons
 * (one per league) collapse to a single entry. The current season's name maps
 * to the current slug so the dropdown stays in sync; other names map to their
 * most recent season.
 */
function buildSeasonOptions(
  playoffSeasons: SeasonWithCounts[],
  current?: SeasonWithCounts
): SeasonOption[] {
  const options: SeasonOption[] = [];
  const seenNames = new Set<string>();
  for (const s of playoffSeasons) {
    if (seenNames.has(s.name)) continue;
    seenNames.add(s.name);
    const slug = current && current.name === s.name ? current.slug : s.slug;
    options.push({ slug, name: s.name });
  }
  return options;
}

/**
 * The slug of the season the index page should redirect to: the most recent
 * season that has a bracket, or null if none exists yet.
 */
export async function getDefaultPlayoffSeasonSlug(): Promise<string | null> {
  const [seasons, playoffIds] = await Promise.all([getSeasons(), getSeasonIdsWithPlayoffs()]);
  const withPlayoffs = new Set(playoffIds);
  const first = seasons.find((s) => withPlayoffs.has(s.id));
  return first?.slug ?? null;
}

/**
 * Everything the /playoffs/[season] page needs. Returns null when the slug
 * doesn't match a season, so the page can render a 404.
 *
 * `leagueSlug` narrows a genuinely multi-league season to one league; for the
 * one-league-per-season shape the league dropdown switches seasons instead.
 */
export async function getPlayoffPageData(
  slug: string,
  leagueSlug?: string
): Promise<PlayoffPageData | null> {
  const season = await getSeasonBySlug(slug);
  if (!season) return null;

  const [allSeasons, playoffIds, currentLeagues] = await Promise.all([
    getSeasons(),
    getSeasonIdsWithPlayoffs(),
    playoffLeaguesOf(season),
  ]);

  const withPlayoffs = new Set(playoffIds);
  const playoffSeasons = allSeasons.filter((s) => withPlayoffs.has(s.id));
  const seasons = buildSeasonOptions(playoffSeasons, season);

  // Family = same-named seasons that have a bracket (this season included).
  const family = playoffSeasons.filter((s) => s.name === season.name);
  const multiLeagueSeason = currentLeagues.length > 1;

  let leagues: LeagueOption[];
  let currentLeagueValue: string;
  let currentLeagueName: string | null;
  let leagueId: string | undefined;

  if (multiLeagueSeason) {
    // One season, many leagues → filter in place with ?league=.
    const requested =
      leagueSlug && leagueSlug !== ALL_LEAGUES
        ? currentLeagues.find((l) => l.slug === leagueSlug)
        : undefined;
    currentLeagueValue = requested?.slug ?? ALL_LEAGUES;
    currentLeagueName = requested?.name ?? null;
    leagueId = requested?.id;
    leagues = [
      { label: 'All Leagues', value: ALL_LEAGUES, href: `/playoffs/${season.slug}/` },
      ...[...currentLeagues]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((l) => ({
          label: l.name,
          value: l.slug,
          href: `/playoffs/${season.slug}/?league=${encodeURIComponent(l.slug)}`,
        })),
    ];
  } else {
    // One league per season → the dropdown switches between the family seasons.
    const familyLeagueIds = await Promise.all(family.map((s) => getPlayoffLeagueIdsBySeason(s.id)));
    const entries: LeagueOption[] = [];
    family.forEach((s, i) => {
      const ids = new Set(familyLeagueIds[i]);
      const seasonLeagues = s.leagueSeasons.map((ls) => ls.league).filter((l) => ids.has(l.id));
      for (const league of seasonLeagues) {
        entries.push({ label: league.name, value: s.slug, href: `/playoffs/${s.slug}/` });
      }
    });
    leagues = entries.sort((a, b) => a.label.localeCompare(b.label));
    currentLeagueValue = season.slug;
    currentLeagueName = currentLeagues[0]?.name ?? null;
    leagueId = undefined;
  }

  const [teams, matches] = await Promise.all([
    getSeasonTeams(season.id, leagueId),
    getPlayoffMatchesBySeason(season.id, leagueId),
  ]);

  const viewModel = buildPlayoffViewModel({ season, teams, matches });

  return { season, seasons, leagues, currentLeagueValue, currentLeagueName, viewModel };
}
