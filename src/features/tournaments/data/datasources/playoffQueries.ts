import { prisma } from '../../../../lib/prisma';
import type { MatchStage } from '@prisma/client';
import type { MatchWithTeamsAndLeagueAndSeason } from '../../../cms/types';

/**
 * Stages that make up a playoff bracket. Regular season, preseason, and
 * exhibition games are intentionally excluded — this feeds the bracket view.
 */
export const PLAYOFF_STAGES: MatchStage[] = [
  'QUALIFIER',
  'PLAYOFF',
  'QUARTER_FINALS',
  'SEMI_FINALS',
  'CHAMPIONSHIP',
];

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
