import { prisma } from '../../../../lib/prisma';
import type { MatchWithTeamsAndLeagueAndSeason } from '../../../cms/types';

// Single source of truth for which stages are playoffs — shared with the match
// form and API so the bracket query and the enforcement rules never drift.
import { PLAYOFF_STAGES } from '../../../matches/lib/playoff-rules';

export { PLAYOFF_STAGES };

/**
 * All bracket-stage matches for a season, ordered chronologically so the
 * converter can group them into rounds. Includes both teams and the winner.
 */
export async function getPlayoffMatchesBySeason(
  seasonId: string
): Promise<MatchWithTeamsAndLeagueAndSeason[]> {
  const matches = await (prisma.match.findMany({
    where: {
      seasonId,
      stage: { in: PLAYOFF_STAGES },
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
