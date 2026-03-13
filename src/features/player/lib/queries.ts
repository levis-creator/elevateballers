/**
 * Player-related queries
 */

import { prisma } from '../../../lib/prisma';
import type { MatchWithTeamsAndLeagueAndSeason } from '../../cms/types';
import { calculatePlayerStatistics } from './playerStats';

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
    select: { matchId: true, teamId: true },
    distinct: ['matchId'],
  });

  const matchIds = matchPlayers.map((mp) => mp.matchId);

  // Build a map of matchId -> player's teamId for that match
  const matchTeamMap = new Map(matchPlayers.map((mp) => [mp.matchId, (mp as any).teamId]));

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
      winner: {
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
        },
      },
    },
    orderBy: {
      date: 'desc',
    },
    take: limit,
  });

  return matches.map((m) => ({
    ...m,
    playerTeamId: matchTeamMap.get(m.id) || null,
  })) as any;
}

/**
 * Get team history for a player
 */
export async function getPlayerTeamHistory(playerId: string): Promise<Array<{
  id: string;
  teamId: string | null;
  joinedAt: Date;
  leftAt: Date | null;
  team: { id: string; name: string; slug: string; logo: string | null } | null;
}>> {
  const history = await prisma.playerTeamHistory.findMany({
    where: { playerId },
    select: {
      id: true,
      teamId: true,
      joinedAt: true,
      leftAt: true,
      team: {
        select: { id: true, name: true, slug: true, logo: true },
      },
    },
    orderBy: { joinedAt: 'asc' },
  });
  return history;
}

/**
 * Get computed stats for all players in a team, calculated from match events.
 * Returns a map of playerId -> stats object in the format expected by TeamDetailsTable.
 */
export async function getTeamPlayerStats(
  teamId: string
): Promise<Record<string, Record<string, number>>> {
  // Fetch all completed matches for this team with their events
  const matches = await prisma.match.findMany({
    where: {
      status: 'COMPLETED',
      OR: [{ team1Id: teamId }, { team2Id: teamId }],
    },
    select: {
      id: true,
      status: true,
      events: {
        where: { isUndone: false },
        select: {
          eventType: true,
          playerId: true,
          assistPlayerId: true,
          isUndone: true,
        },
      },
    },
  });

  if (matches.length === 0) return {};

  // Collect all unique playerIds that appear in these match events
  const playerIds = new Set<string>();
  for (const match of matches) {
    for (const event of match.events) {
      if (event.playerId) playerIds.add(event.playerId);
    }
  }

  // Calculate stats per player
  const result: Record<string, Record<string, number>> = {};
  for (const playerId of playerIds) {
    const stats = calculatePlayerStatistics(matches as any, playerId);
    if (stats.totalMatches > 0) {
      result[playerId] = {
        ppg: stats.pointsPerGame,
        rpg: stats.reboundsPerGame,
        apg: stats.assistsPerGame,
        spg: stats.stealsPerGame,
        bpg: stats.blocksPerGame,
        fgPercent: stats.fieldGoalPercentage,
        ftPercent: stats.freeThrowPercentage,
        threePointPercent: stats.threePointPercentage,
      };
    }
  }

  return result;
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
