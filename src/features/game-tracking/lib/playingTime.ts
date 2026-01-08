/**
 * Playing time tracking utilities
 * Calculates and tracks player playing time based on substitutions
 */

import { prisma } from '../../../lib/prisma';
import type { PlayerPlayingTime } from '@prisma/client';

/**
 * Get playing time segments for a player in a match
 */
export async function getPlayerPlayingTime(
  matchId: string,
  playerId: string
): Promise<PlayerPlayingTime[]> {
  const matchPlayer = await prisma.matchPlayer.findFirst({
    where: {
      matchId,
      playerId,
    },
  });

  if (!matchPlayer) {
    return [];
  }

  return await prisma.playerPlayingTime.findMany({
    where: {
      matchPlayerId: matchPlayer.id,
    },
    orderBy: [
      { period: 'asc' },
      { entryTime: 'asc' },
    ],
  });
}

/**
 * Get total playing time in seconds for a player in a match
 */
export async function getTotalPlayingTime(
  matchId: string,
  playerId: string
): Promise<number> {
  const segments = await getPlayerPlayingTime(matchId, playerId);
  
  return segments.reduce((total, segment) => {
    if (segment.secondsPlayed !== null) {
      return total + segment.secondsPlayed;
    }
    // If no exit time, calculate from entry time to now (or end of match)
    if (segment.exitTime === null && segment.entryTime) {
      const now = new Date();
      const seconds = Math.floor((now.getTime() - segment.entryTime.getTime()) / 1000);
      return total + Math.max(0, seconds);
    }
    return total;
  }, 0);
}

/**
 * Record playing time entry (when player enters game)
 */
export async function recordPlayingTimeEntry(
  matchPlayerId: string,
  period: number,
  entryTime: Date
): Promise<PlayerPlayingTime | null> {
  try {
    // Check if there's an open entry (no exit time)
    const openEntry = await prisma.playerPlayingTime.findFirst({
      where: {
        matchPlayerId,
        period,
        exitTime: null,
      },
    });

    if (openEntry) {
      // Already have an open entry, don't create duplicate
      return openEntry;
    }

    return await prisma.playerPlayingTime.create({
      data: {
        matchPlayerId,
        period,
        entryTime,
      },
    });
  } catch (error) {
    console.error('Error recording playing time entry:', error);
    return null;
  }
}

/**
 * Record playing time exit (when player leaves game)
 */
export async function recordPlayingTimeExit(
  matchPlayerId: string,
  period: number,
  exitTime: Date
): Promise<PlayerPlayingTime | null> {
  try {
    // Find the most recent open entry for this period
    const openEntry = await prisma.playerPlayingTime.findFirst({
      where: {
        matchPlayerId,
        period,
        exitTime: null,
      },
      orderBy: { entryTime: 'desc' },
    });

    if (!openEntry) {
      // No open entry found, create a new entry-exit pair
      return await prisma.playerPlayingTime.create({
        data: {
          matchPlayerId,
          period,
          entryTime: exitTime, // Approximate entry time
          exitTime,
          secondsPlayed: 0,
        },
      });
    }

    // Calculate seconds played
    const secondsPlayed = Math.floor((exitTime.getTime() - openEntry.entryTime.getTime()) / 1000);

    return await prisma.playerPlayingTime.update({
      where: { id: openEntry.id },
      data: {
        exitTime,
        secondsPlayed,
      },
    });
  } catch (error) {
    console.error('Error recording playing time exit:', error);
    return null;
  }
}
