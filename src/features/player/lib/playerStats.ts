/**
 * Player statistics calculation utilities
 * Calculate player statistics from match events
 */

import type { MatchEventType } from '@prisma/client';

export type PlayerMatchStatistics = {
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

export type PlayerStatistics = {
  totalMatches: number;
  totalPoints: number;
  totalFieldGoalsMade: number;
  totalFieldGoalsAttempted: number;
  totalThreePointersMade: number;
  totalThreePointersAttempted: number;
  totalFreeThrowsMade: number;
  totalFreeThrowsAttempted: number;
  totalRebounds: number;
  totalAssists: number;
  totalSteals: number;
  totalBlocks: number;
  totalTurnovers: number;
  totalFouls: number;
  // Averages
  pointsPerGame: number;
  reboundsPerGame: number;
  assistsPerGame: number;
  stealsPerGame: number;
  blocksPerGame: number;
  turnoversPerGame: number;
  foulsPerGame: number;
  // Percentages
  fieldGoalPercentage: number;
  threePointPercentage: number;
  freeThrowPercentage: number;
};

export type MatchEvent = {
  eventType: MatchEventType;
  playerId: string | null;
  assistPlayerId?: string | null;
  isUndone?: boolean;
};

/**
 * Calculate player statistics from match events for a single match
 */
export function calculatePlayerMatchStats(
  playerId: string,
  events: MatchEvent[]
): PlayerMatchStatistics {
  const stats: PlayerMatchStatistics = {
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

  // Filter events for this player that are not undone
  const playerEvents = events.filter(
    (e) => e.playerId === playerId && !e.isUndone
  );

  playerEvents.forEach((event) => {
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
 * Calculate aggregate player statistics from multiple matches
 */
export function calculatePlayerStatistics(
  matches: Array<{
    id: string;
    status: string;
    events?: MatchEvent[];
  }>,
  playerId: string
): PlayerStatistics {
  const stats: PlayerStatistics = {
    totalMatches: 0,
    totalPoints: 0,
    totalFieldGoalsMade: 0,
    totalFieldGoalsAttempted: 0,
    totalThreePointersMade: 0,
    totalThreePointersAttempted: 0,
    totalFreeThrowsMade: 0,
    totalFreeThrowsAttempted: 0,
    totalRebounds: 0,
    totalAssists: 0,
    totalSteals: 0,
    totalBlocks: 0,
    totalTurnovers: 0,
    totalFouls: 0,
    pointsPerGame: 0,
    reboundsPerGame: 0,
    assistsPerGame: 0,
    stealsPerGame: 0,
    blocksPerGame: 0,
    turnoversPerGame: 0,
    foulsPerGame: 0,
    fieldGoalPercentage: 0,
    threePointPercentage: 0,
    freeThrowPercentage: 0,
  };

  matches.forEach((match) => {
    // Only count completed matches
    if (match.status !== 'COMPLETED' || !match.events) {
      return;
    }

    const matchStats = calculatePlayerMatchStats(playerId, match.events);
    
    // Only count matches where player had activity
    if (matchStats.fieldGoalsAttempted > 0 || matchStats.rebounds > 0 || 
        matchStats.assists > 0 || matchStats.steals > 0 || 
        matchStats.blocks > 0 || matchStats.turnovers > 0 || matchStats.fouls > 0) {
      stats.totalMatches++;
      stats.totalPoints += matchStats.points;
      stats.totalFieldGoalsMade += matchStats.fieldGoalsMade;
      stats.totalFieldGoalsAttempted += matchStats.fieldGoalsAttempted;
      stats.totalThreePointersMade += matchStats.threePointersMade;
      stats.totalThreePointersAttempted += matchStats.threePointersAttempted;
      stats.totalFreeThrowsMade += matchStats.freeThrowsMade;
      stats.totalFreeThrowsAttempted += matchStats.freeThrowsAttempted;
      stats.totalRebounds += matchStats.rebounds;
      stats.totalAssists += matchStats.assists;
      stats.totalSteals += matchStats.steals;
      stats.totalBlocks += matchStats.blocks;
      stats.totalTurnovers += matchStats.turnovers;
      stats.totalFouls += matchStats.fouls;
    }
  });

  // Calculate averages
  if (stats.totalMatches > 0) {
    stats.pointsPerGame = stats.totalPoints / stats.totalMatches;
    stats.reboundsPerGame = stats.totalRebounds / stats.totalMatches;
    stats.assistsPerGame = stats.totalAssists / stats.totalMatches;
    stats.stealsPerGame = stats.totalSteals / stats.totalMatches;
    stats.blocksPerGame = stats.totalBlocks / stats.totalMatches;
    stats.turnoversPerGame = stats.totalTurnovers / stats.totalMatches;
    stats.foulsPerGame = stats.totalFouls / stats.totalMatches;
  }

  // Calculate percentages
  if (stats.totalFieldGoalsAttempted > 0) {
    stats.fieldGoalPercentage = (stats.totalFieldGoalsMade / stats.totalFieldGoalsAttempted) * 100;
  }
  if (stats.totalThreePointersAttempted > 0) {
    stats.threePointPercentage = (stats.totalThreePointersMade / stats.totalThreePointersAttempted) * 100;
  }
  if (stats.totalFreeThrowsAttempted > 0) {
    stats.freeThrowPercentage = (stats.totalFreeThrowsMade / stats.totalFreeThrowsAttempted) * 100;
  }

  return stats;
}
