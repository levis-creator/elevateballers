/**
 * Score calculation utilities
 * Calculate and update match scores from events
 */

import type { PrismaClient } from '@prisma/client';
import type { MatchEventType } from '@prisma/client';

/**
 * Get points value for a scoring event type
 * Returns 0 for non-scoring events
 */
export function getPointsForEventType(eventType: MatchEventType): number {
  switch (eventType) {
    case 'TWO_POINT_MADE':
      return 2;
    case 'THREE_POINT_MADE':
      return 3;
    case 'FREE_THROW_MADE':
      return 1;
    default:
      return 0;
  }
}

/**
 * Check if an event type is a scoring event
 */
export function isScoringEvent(eventType: MatchEventType): boolean {
  return getPointsForEventType(eventType) > 0;
}

/**
 * Calculate scores from all non-undone scoring events for a match
 */
export async function calculateScoresFromEvents(
  matchId: string,
  prismaClient: PrismaClient | any
): Promise<{ team1Score: number; team2Score: number }> {
  // Fetch match to get team IDs
  const match = await prismaClient.match.findUnique({
    where: { id: matchId },
    select: {
      team1Id: true,
      team2Id: true,
    },
  });

  if (!match) {
    return { team1Score: 0, team2Score: 0 };
  }

  const team1Id = match.team1Id;
  const team2Id = match.team2Id;

  // If no team IDs, return 0 for both scores
  if (!team1Id && !team2Id) {
    return { team1Score: 0, team2Score: 0 };
  }

  // Fetch all non-undone scoring events for this match
  const scoringEvents = await prismaClient.matchEvent.findMany({
    where: {
      matchId,
      isUndone: false,
      eventType: {
        in: ['TWO_POINT_MADE', 'THREE_POINT_MADE', 'FREE_THROW_MADE'],
      },
    },
    select: {
      eventType: true,
      teamId: true,
    },
  });

  let team1Score = 0;
  let team2Score = 0;

  // Sum points per team
  for (const event of scoringEvents) {
    if (!event.teamId) {
      // Skip events without teamId
      continue;
    }

    const points = getPointsForEventType(event.eventType);

    if (event.teamId === team1Id) {
      team1Score += points;
    } else if (event.teamId === team2Id) {
      team2Score += points;
    }
    // Skip events with teamId that doesn't match either team
  }

  return { team1Score, team2Score };
}

/**
 * Recalculate and update match scores from events
 * Can be used within a transaction by passing the transaction client
 */
export async function updateMatchScoresFromEvents(
  matchId: string,
  prismaClient: PrismaClient | any
): Promise<boolean> {
  try {
    const scores = await calculateScoresFromEvents(matchId, prismaClient);

    await prismaClient.match.update({
      where: { id: matchId },
      data: {
        team1Score: scores.team1Score,
        team2Score: scores.team2Score,
      },
    });

    return true;
  } catch (error) {
    console.error('Error updating match scores from events:', error);
    return false;
  }
}
