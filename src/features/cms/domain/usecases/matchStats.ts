/**
 * Match statistics calculation utilities
 * Calculate team statistics from match events
 */

import type { MatchEventType } from '@prisma/client';

export type TeamMatchStatistics = {
  points: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  threePointersMade: number;
  threePointersAttempted: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
};

export type MatchEvent = {
  eventType: MatchEventType;
  teamId: string | null;
  isUndone?: boolean;
};

/**
 * Calculate team statistics from match events
 */
export function calculateTeamMatchStats(
  teamId: string,
  events: MatchEvent[]
): TeamMatchStatistics {
  const stats: TeamMatchStatistics = {
    points: 0,
    fieldGoalsMade: 0,
    fieldGoalsAttempted: 0,
    threePointersMade: 0,
    threePointersAttempted: 0,
    freeThrowsMade: 0,
    freeThrowsAttempted: 0,
    rebounds: 0,
    assists: 0,
    steals: 0,
    blocks: 0,
    turnovers: 0,
    fouls: 0,
  };

  // Filter events for this team that are not undone
  const teamEvents = events.filter(
    (e) => e.teamId === teamId && !e.isUndone
  );

  teamEvents.forEach((event) => {
    switch (event.eventType) {
      case 'TWO_POINT_MADE':
        stats.points += 2;
        stats.fieldGoalsMade++;
        stats.fieldGoalsAttempted++;
        break;
      case 'TWO_POINT_MISSED':
        stats.fieldGoalsAttempted++;
        break;
      case 'THREE_POINT_MADE':
        stats.points += 3;
        stats.threePointersMade++;
        stats.threePointersAttempted++;
        stats.fieldGoalsMade++;
        stats.fieldGoalsAttempted++;
        break;
      case 'THREE_POINT_MISSED':
        stats.threePointersAttempted++;
        stats.fieldGoalsAttempted++;
        break;
      case 'FREE_THROW_MADE':
        stats.points += 1;
        stats.freeThrowsMade++;
        stats.freeThrowsAttempted++;
        break;
      case 'FREE_THROW_MISSED':
        stats.freeThrowsAttempted++;
        break;
      case 'REBOUND_OFFENSIVE':
      case 'REBOUND_DEFENSIVE':
        stats.rebounds++;
        break;
      case 'ASSIST':
        stats.assists++;
        break;
      case 'STEAL':
        stats.steals++;
        break;
      case 'BLOCK':
        stats.blocks++;
        break;
      case 'TURNOVER':
        stats.turnovers++;
        break;
      case 'FOUL_PERSONAL':
      case 'FOUL_TECHNICAL':
      case 'FOUL_FLAGRANT':
        stats.fouls++;
        break;
      default:
        // Other event types don't contribute to stats
        break;
    }
  });

  return stats;
}

/**
 * Calculate field goal percentage
 */
export function getFieldGoalPercentage(
  made: number,
  attempted: number
): number {
  if (attempted === 0) return 0;
  return (made / attempted) * 100;
}

/**
 * Format field goal percentage as string
 */
export function formatFieldGoalPercentage(
  made: number,
  attempted: number
): string {
  const percentage = getFieldGoalPercentage(made, attempted);
  return `${percentage.toFixed(1)}%`;
}
