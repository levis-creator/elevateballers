/**
 * Server-side loader for the public playoffs pages. Pulls the season, its
 * participating teams, and its bracket-stage matches, then hands them to the
 * pure view-model builder. Keeps the Astro frontmatter thin.
 */
import {
  getSeasons,
  getSeasonBySlug,
} from '../../../cms/data/datasources/queries/seasons';
import { getSeasonTeams } from '../../../cms/data/datasources/queries/seasonTeams';
import type { SeasonWithCounts } from '../../../cms/types';
import {
  buildPlayoffViewModel,
  type PlayoffViewModel,
} from '../../domain/usecases/playoff-view-model';
import type { SeasonOption } from '../../presentation/components/SeasonSelector';
import { getPlayoffMatchesBySeason, getSeasonIdsWithPlayoffs } from './playoffQueries';

export interface PlayoffPageData {
  season: SeasonWithCounts;
  seasons: SeasonOption[];
  viewModel: PlayoffViewModel;
}

/** Seasons that have a bracket, most recent first, as selector options. */
async function getPlayoffSeasonOptions(): Promise<SeasonOption[]> {
  const [seasons, playoffIds] = await Promise.all([
    getSeasons(),
    getSeasonIdsWithPlayoffs(),
  ]);
  const withPlayoffs = new Set(playoffIds);
  return seasons
    .filter((s) => withPlayoffs.has(s.id))
    .map((s) => ({ slug: s.slug, name: s.name }));
}

/**
 * The slug of the season the index page should redirect to: the most recent
 * season that has a bracket, or null if none exists yet.
 */
export async function getDefaultPlayoffSeasonSlug(): Promise<string | null> {
  const options = await getPlayoffSeasonOptions();
  return options[0]?.slug ?? null;
}

/**
 * Everything the /playoffs/[season] page needs. Returns null when the slug
 * doesn't match a season, so the page can render a 404.
 */
export async function getPlayoffPageData(slug: string): Promise<PlayoffPageData | null> {
  const season = await getSeasonBySlug(slug);
  if (!season) return null;

  const [teams, matches, seasons] = await Promise.all([
    getSeasonTeams(season.id),
    getPlayoffMatchesBySeason(season.id),
    getPlayoffSeasonOptions(),
  ]);

  const viewModel = buildPlayoffViewModel({ season, teams, matches });

  return { season, seasons, viewModel };
}
