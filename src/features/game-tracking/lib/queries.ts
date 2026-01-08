/**
 * Game tracking queries
 * Database read operations for game state, rules, and tracking data
 */

import { prisma } from '../../../lib/prisma';
import type {
  GameRules,
  GameState,
  MatchPeriod,
  Timeout,
  Substitution,
  MatchWithGameState,
  GameStateWithMatch,
  TimeoutWithRelations,
  SubstitutionWithRelations,
  MatchPeriodWithMatch,
  PlayByPlayEvent,
  PlayByPlayData,
} from '../types';

/**
 * Get game rules by ID
 */
export async function getGameRules(id: string): Promise<GameRules | null> {
  return await prisma.gameRules.findUnique({
    where: { id },
  });
}

/**
 * Get all game rules
 */
export async function getAllGameRules(): Promise<GameRules[]> {
  return await prisma.gameRules.findMany({
    orderBy: { name: 'asc' },
  });
}

/**
 * Get default game rules (or create if none exist)
 */
export async function getDefaultGameRules(): Promise<GameRules> {
  const defaultRules = await prisma.gameRules.findFirst({
    where: { name: 'Default' },
  });

  if (defaultRules) {
    return defaultRules;
  }

  // Create default rules if none exist
  return await prisma.gameRules.create({
    data: {
      name: 'Default',
      description: 'Default basketball game rules',
      numberOfPeriods: 4,
      minutesPerPeriod: 10,
      overtimeLength: 5,
      halftimePeriod: 2, // Halftime after 2nd quarter (NBA style)
      halftimeDurationMinutes: 15,
      timeouts60Second: 6,
      timeouts30Second: 2,
      timeoutsPerOvertime: 2,
      resetTimeoutsPerPeriod: false,
      foulsForBonus: 5,
      foulsForDoubleBonus: 10,
      enableThreePointShots: true,
      foulsToFoulOut: 5,
      displayGameClock: true,
      trackTurnoverTypes: false,
      trackFoulTypes: false,
      trackPlayingTime: false,
      recordShotLocations: false,
    },
  });
}

/**
 * Get match with game state
 */
export async function getMatchWithGameState(matchId: string): Promise<MatchWithGameState | null> {
  return await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      gameRules: true,
      periods: {
        orderBy: { periodNumber: 'asc' },
      },
      timeouts: {
        orderBy: { createdAt: 'desc' },
        include: {
          team: true,
        },
      },
      substitutions: {
        orderBy: { createdAt: 'desc' },
        include: {
          team: true,
          playerIn: true,
          playerOut: true,
        },
      },
    },
  });
}

/**
 * Get current game state for a match
 */
export async function getGameState(matchId: string): Promise<GameStateData | null> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      currentPeriod: true,
      clockSeconds: true,
      clockRunning: true,
      team1Score: true,
      team2Score: true,
      team1Fouls: true,
      team2Fouls: true,
      team1Timeouts: true,
      team2Timeouts: true,
      possessionTeamId: true,
    },
  });

  if (!match) {
    return null;
  }

  return {
    matchId: match.id,
    period: match.currentPeriod,
    clockSeconds: match.clockSeconds,
    clockRunning: match.clockRunning,
    team1Score: match.team1Score ?? 0,
    team2Score: match.team2Score ?? 0,
    team1Fouls: match.team1Fouls,
    team2Fouls: match.team2Fouls,
    team1Timeouts: match.team1Timeouts,
    team2Timeouts: match.team2Timeouts,
    possessionTeamId: match.possessionTeamId,
  };
}

/**
 * Get game state snapshots (history)
 */
export async function getGameStateHistory(matchId: string): Promise<GameStateWithMatch[]> {
  return await prisma.gameState.findMany({
    where: { matchId },
    include: {
      match: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get match periods
 */
export async function getMatchPeriods(matchId: string): Promise<MatchPeriod[]> {
  return await prisma.matchPeriod.findMany({
    where: { matchId },
    orderBy: { periodNumber: 'asc' },
  });
}

/**
 * Get match period by number
 */
export async function getMatchPeriod(
  matchId: string,
  periodNumber: number
): Promise<MatchPeriod | null> {
  return await prisma.matchPeriod.findUnique({
    where: {
      matchId_periodNumber: {
        matchId,
        periodNumber,
      },
    },
  });
}

/**
 * Get timeouts for a match
 */
export async function getMatchTimeouts(matchId: string): Promise<TimeoutWithRelations[]> {
  return await prisma.timeout.findMany({
    where: { matchId },
    include: {
      match: true,
      team: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get timeouts for a specific period
 */
export async function getPeriodTimeouts(
  matchId: string,
  period: number
): Promise<TimeoutWithRelations[]> {
  return await prisma.timeout.findMany({
    where: {
      matchId,
      period,
    },
    include: {
      match: true,
      team: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get timeouts with optional filters
 */
export async function getFilteredTimeouts(
  matchId: string,
  filters?: {
    period?: number;
    teamId?: string;
    timeoutType?: 'SIXTY_SECOND' | 'THIRTY_SECOND';
  }
): Promise<TimeoutWithRelations[]> {
  const where: any = { matchId };

  if (filters?.period !== undefined) {
    where.period = filters.period;
  }

  if (filters?.teamId) {
    where.teamId = filters.teamId;
  }

  if (filters?.timeoutType) {
    where.timeoutType = filters.timeoutType;
  }

  return await prisma.timeout.findMany({
    where,
    include: {
      match: true,
      team: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get substitutions for a match
 */
export async function getMatchSubstitutions(matchId: string): Promise<SubstitutionWithRelations[]> {
  return await prisma.substitution.findMany({
    where: { matchId },
    include: {
      match: true,
      team: true,
      playerIn: true,
      playerOut: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get substitutions for a specific period
 */
export async function getPeriodSubstitutions(
  matchId: string,
  period: number
): Promise<SubstitutionWithRelations[]> {
  return await prisma.substitution.findMany({
    where: {
      matchId,
      period,
    },
    include: {
      match: true,
      team: true,
      playerIn: true,
      playerOut: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get play-by-play data for a match
 */
export async function getPlayByPlay(matchId: string): Promise<PlayByPlayData> {
  const [events, periods] = await Promise.all([
    prisma.matchEvent.findMany({
      where: {
        matchId,
        isUndone: false,
      },
      include: {
        player: true,
        assistPlayer: true,
        team: true,
      },
      orderBy: [
        { period: 'asc' },
        { sequenceNumber: 'asc' },
      ],
    }),
    getMatchPeriods(matchId),
  ]);

  return {
    events: events as PlayByPlayEvent[],
    periods,
  };
}

/**
 * Get jump balls for a match
 */
export async function getMatchJumpBalls(matchId: string): Promise<JumpBallWithRelations[]> {
  return await prisma.jumpBall.findMany({
    where: { matchId },
    include: {
      match: true,
      player1: true,
      player2: true,
      possessionTeam: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get jump balls for a specific period
 */
export async function getPeriodJumpBalls(
  matchId: string,
  period: number
): Promise<JumpBallWithRelations[]> {
  return await prisma.jumpBall.findMany({
    where: {
      matchId,
      period,
    },
    include: {
      match: true,
      player1: true,
      player2: true,
      possessionTeam: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}
