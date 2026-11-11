import { prisma } from '../../../../lib/prisma';
import type { MatchWithTeamsAndLeagueAndSeason } from '../../../cms/types';

// Single source of truth for which stages are playoffs — shared with the match
// form and API so the bracket query and the enforcement rules never drift.
import { PLAYOFF_STAGES } from '../../../matches/lib/playoff-rules';
import { buildBracketLinks, type BracketLinks } from '../../domain/usecases/bracket-links';

export { PLAYOFF_STAGES };

/**
 * All bracket-stage matches for a season, ordered chronologically so the
 * converter can group them into rounds. Includes both teams and the winner.
 * When `leagueId` is given, only that league's matches are returned.
 */
export async function getPlayoffMatchesBySeason(
  seasonId: string,
  leagueId?: string
): Promise<MatchWithTeamsAndLeagueAndSeason[]> {
  const matches = await (prisma.match.findMany({
    where: {
      seasonId,
      stage: { in: PLAYOFF_STAGES },
      ...(leagueId ? { leagueId } : {}),
    },
    include: {
      team1: true,
      team2: true,
      league: true,
      season: true,
      winner: true,
    },
    orderBy: { date: 'asc' },
  }) as Promise<MatchWithTeamsAndLeagueAndSeason[]>);

  return matches;
}

/**
 * The league ids that have at least one bracket-stage match within a season —
 * i.e. the leagues that actually have a playoff to show. Used to build the
 * league filter on the playoffs page.
 */
export async function getPlayoffLeagueIdsBySeason(seasonId: string): Promise<string[]> {
  const rows = await prisma.match.findMany({
    where: { seasonId, stage: { in: PLAYOFF_STAGES }, leagueId: { not: null } },
    distinct: ['leagueId'],
    select: { leagueId: true },
  });
  return rows.map((r: { leagueId: string | null }) => r.leagueId).filter((id): id is string => Boolean(id));
}

/**
 * The ids of seasons that have at least one bracket-stage match — i.e. seasons
 * that actually have a playoff to show. Used to build the season selector and
 * to resolve the default season for the index page.
 */
export async function getSeasonIdsWithPlayoffs(): Promise<string[]> {
  const rows = await prisma.match.findMany({
    where: { stage: { in: PLAYOFF_STAGES }, seasonId: { not: null } },
    distinct: ['seasonId'],
    select: { seasonId: true },
    orderBy: { date: 'desc' },
  });
  return rows.map((r: { seasonId: string | null }) => r.seasonId).filter((id): id is string => Boolean(id));
}

/**
 * Bracket links for every competition with bracket-stage games, for linking
 * from pages such as Standings. See `buildBracketLinks` for the URL rules.
 */
export async function getPlayoffBracketLinks(): Promise<BracketLinks> {
  const editions = (await prisma.match.findMany({
    where: { stage: { in: PLAYOFF_STAGES }, seasonId: { not: null } },
    distinct: ['seasonId', 'leagueId'],
    select: { seasonId: true, leagueId: true },
  })) as { seasonId: string; leagueId: string | null }[];
  if (!editions.length) return { byEdition: {}, bySeason: {} };
  const seasons = await prisma.season.findMany({
    where: { id: { in: [...new Set(editions.map((edition) => edition.seasonId))] } },
    select: { id: true, slug: true, leagueSeasons: { select: { league: { select: { id: true, slug: true } } } } },
  });
  return buildBracketLinks(
    editions,
    seasons.map((season) => ({
      id: season.id,
      slug: season.slug,
      leagues: season.leagueSeasons.map((entry) => entry.league),
    }))
  );
}
