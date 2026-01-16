/**
 * Player-related queries
 */

import { prisma } from '../../../lib/prisma';
import type { MatchWithTeamsAndLeagueAndSeason } from '../../cms/types';

/**
 * Get matches where a player participated
 */
export async function getPlayerMatches(
  playerId: string,
  limit?: number
): Promise<MatchWithTeamsAndLeagueAndSeason[]> {
  // Get match IDs where player participated
  const matchPlayers = await prisma.matchPlayer.findMany({
    where: { playerId },
    select: { matchId: true },
    distinct: ['matchId'],
  });

  const matchIds = matchPlayers.map((mp) => mp.matchId);

  if (matchIds.length === 0) {
    return [];
  }

  // Get matches with team and league info
  const matches = await prisma.match.findMany({
    where: {
      id: { in: matchIds },
    },
    // @ts-expect-error - Prisma types will be correct after full sync
    include: {
      team1: {
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
        },
      },
      team2: {
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
        },
      },
      league: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      season: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: {
      date: 'desc',
    },
    take: limit,
  });

  return matches as MatchWithTeamsAndLeagueAndSeason[];
}

/**
 * Get player events for a specific match
 */
export async function getPlayerMatchEvents(
  matchId: string,
  playerId: string
): Promise<Array<{
  eventType: string;
  playerId: string | null;
  assistPlayerId: string | null;
  isUndone: boolean;
}>> {
  const events = await prisma.matchEvent.findMany({
    where: {
      matchId,
      playerId,
      isUndone: false,
    },
    select: {
      eventType: true,
      playerId: true,
      assistPlayerId: true,
      isUndone: true,
    },
    orderBy: [
      { period: 'asc' },
      { sequenceNumber: 'asc' },
    ],
  });

  return events;
}
