/**
 * Game tracking mutations
 * Database write operations for game state, rules, and tracking data
 */

import { prisma } from '../../../lib/prisma';
import type {
  CreateGameRulesInput,
  UpdateGameRulesInput,
  UpdateGameStateInput,
  CreateTimeoutInput,
  CreateSubstitutionInput,
  CreateMatchPeriodInput,
  UpdateMatchPeriodInput,
  CreateJumpBallInput,
  GameRules,
  GameState,
  MatchPeriod,
  Timeout,
  Substitution,
  JumpBall,
} from '../types';

/**
 * Create game rules
 */
export async function createGameRules(data: CreateGameRulesInput): Promise<GameRules | null> {
  try {
    return await prisma.gameRules.create({
      data: {
        name: data.name,
        description: data.description,
        numberOfPeriods: data.numberOfPeriods ?? 4,
        minutesPerPeriod: data.minutesPerPeriod ?? 10,
        overtimeLength: data.overtimeLength ?? 5,
        halftimePeriod: data.halftimePeriod ?? (data.numberOfPeriods === 2 ? 1 : 2),
        halftimeDurationMinutes: data.halftimeDurationMinutes ?? 15,
        timeouts60Second: data.timeouts60Second ?? 6,
        timeouts30Second: data.timeouts30Second ?? 2,
        timeoutsPerOvertime: data.timeoutsPerOvertime ?? 2,
        resetTimeoutsPerPeriod: data.resetTimeoutsPerPeriod ?? false,
        foulsForBonus: data.foulsForBonus ?? 5,
        foulsForDoubleBonus: data.foulsForDoubleBonus ?? 10,
        enableThreePointShots: data.enableThreePointShots ?? true,
        foulsToFoulOut: data.foulsToFoulOut ?? 5,
        displayGameClock: data.displayGameClock ?? true,
        trackTurnoverTypes: data.trackTurnoverTypes ?? false,
        trackFoulTypes: data.trackFoulTypes ?? false,
        trackPlayingTime: data.trackPlayingTime ?? false,
        recordShotLocations: data.recordShotLocations ?? false,
      },
    });
  } catch (error) {
    console.error('Error creating game rules:', error);
    return null;
  }
}

/**
 * Update game rules
 */
export async function updateGameRules(
  id: string,
  data: UpdateGameRulesInput
): Promise<GameRules | null> {
  try {
    return await prisma.gameRules.update({
      where: { id },
      data,
    });
  } catch (error) {
    console.error('Error updating game rules:', error);
    return null;
  }
}

/**
 * Delete game rules
 */
export async function deleteGameRules(id: string): Promise<boolean> {
  try {
    await prisma.gameRules.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    console.error('Error deleting game rules:', error);
    return false;
  }
}

/**
 * Update game state
 */
export async function updateGameState(
  matchId: string,
  data: UpdateGameStateInput
): Promise<boolean> {
  try {
    await prisma.match.update({
      where: { id: matchId },
      data: {
        clockSeconds: data.clockSeconds,
        clockRunning: data.clockRunning,
        currentPeriod: data.currentPeriod,
        team1Score: data.team1Score,
        team2Score: data.team2Score,
        team1Fouls: data.team1Fouls,
        team2Fouls: data.team2Fouls,
        team1Timeouts: data.team1Timeouts,
        team2Timeouts: data.team2Timeouts,
        possessionTeamId: data.possessionTeamId,
      },
    });
    return true;
  } catch (error) {
    console.error('Error updating game state:', error);
    return false;
  }
}

/**
 * Create game state snapshot
 */
export async function createGameStateSnapshot(matchId: string): Promise<GameState | null> {
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: {
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

    return await prisma.gameState.create({
      data: {
        matchId,
        period: match.currentPeriod,
        clockSeconds: match.clockSeconds ?? 0,
        clockRunning: match.clockRunning,
        team1Score: match.team1Score ?? 0,
        team2Score: match.team2Score ?? 0,
        team1Fouls: match.team1Fouls,
        team2Fouls: match.team2Fouls,
        team1Timeouts: match.team1Timeouts,
        team2Timeouts: match.team2Timeouts,
        possessionTeamId: match.possessionTeamId,
      },
    });
  } catch (error) {
    console.error('Error creating game state snapshot:', error);
    return null;
  }
}

/**
 * Start game (initialize game state)
 */
export async function startGame(matchId: string, gameRulesId?: string): Promise<boolean> {
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { gameRules: true },
    });

    if (!match) {
      return false;
    }

    const rules = match.gameRules || (gameRulesId ? await prisma.gameRules.findUnique({
      where: { id: gameRulesId },
    }) : null);

    if (!rules) {
      // Use default rules if none specified
      const defaultRules = await prisma.gameRules.findFirst({ where: { name: 'Default' } });
      if (defaultRules) {
        await prisma.match.update({
          where: { id: matchId },
          data: { gameRulesId: defaultRules.id },
        });
      }
    }

    const periodLengthSeconds = (rules?.minutesPerPeriod ?? 10) * 60;

    await prisma.match.update({
      where: { id: matchId },
      data: {
        status: 'LIVE',
        currentPeriod: 1,
        clockSeconds: periodLengthSeconds,
        clockRunning: true,
        team1Score: 0,
        team2Score: 0,
        team1Fouls: 0,
        team2Fouls: 0,
        team1Timeouts: rules?.timeouts60Second ?? 6,
        team2Timeouts: rules?.timeouts60Second ?? 6,
        gameRulesId: rules?.id ?? gameRulesId,
      },
    });

    // Create first period
    await createMatchPeriod({
      matchId,
      periodNumber: 1,
      startTime: new Date(),
      team1Score: 0,
      team2Score: 0,
      team1Fouls: 0,
      team2Fouls: 0,
    });

    return true;
  } catch (error) {
    console.error('Error starting game:', error);
    return false;
  }
}

/**
 * Pause/resume game clock
 */
export async function toggleGameClock(matchId: string, running?: boolean, clockSeconds?: number): Promise<boolean> {
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { clockRunning: true },
    });

    if (!match) {
      return false;
    }

    const newState = running !== undefined ? running : !match.clockRunning;

    // When pausing (transitioning from running to stopped), save the current clock seconds
    const updateData: { clockRunning: boolean; clockSeconds?: number } = { clockRunning: newState };
    if (newState === false && clockSeconds !== undefined) {
      updateData.clockSeconds = clockSeconds;
    }

    await prisma.match.update({
      where: { id: matchId },
      data: updateData,
    });

    return true;
  } catch (error) {
    console.error('Error toggling game clock:', error);
    return false;
  }
}

/**
 * Create timeout
 */
export async function createTimeout(data: CreateTimeoutInput): Promise<Timeout | null> {
  try {
    // Update team timeout count
    const match = await prisma.match.findUnique({
      where: { id: data.matchId },
      include: { gameRules: true },
    });

    if (!match) {
      return null;
    }

    const isTeam1 = match.team1Id === data.teamId;
    const timeoutField = isTeam1 ? 'team1Timeouts' : 'team2Timeouts';
    let currentTimeouts = isTeam1 ? match.team1Timeouts : match.team2Timeouts;

    // If timeout count is 0 or null (game hasn't started), initialize timeouts from game rules
    if (currentTimeouts === null || currentTimeouts === 0) {
      const defaultTimeouts = match.gameRules?.timeouts60Second ?? 6;
      // Initialize timeouts for this team (and the other team if also 0/null)
      const updateData: any = {
        [timeoutField]: defaultTimeouts,
      };
      // Also initialize the other team's timeouts if they're 0/null
      const otherTimeoutField = isTeam1 ? 'team2Timeouts' : 'team1Timeouts';
      const otherTimeouts = isTeam1 ? match.team2Timeouts : match.team1Timeouts;
      if (otherTimeouts === null || otherTimeouts === 0) {
        updateData[otherTimeoutField] = defaultTimeouts;
      }
      
      await prisma.match.update({
        where: { id: data.matchId },
        data: updateData,
      });
      
      // Update currentTimeouts to the initialized value
      currentTimeouts = defaultTimeouts;
    }

    if (currentTimeouts <= 0) {
      throw new Error('No timeouts remaining');
    }

    // Get sequence number for match event
    const { getNextSequenceNumber } = await import('./utils');
    const sequenceNumber = await getNextSequenceNumber(data.matchId, prisma);

    // Calculate minute from secondsRemaining (approximate)
    const periodLengthSeconds = (match.gameRules?.minutesPerPeriod ?? 10) * 60;
    const minute = data.secondsRemaining 
      ? Math.ceil((periodLengthSeconds - data.secondsRemaining) / 60)
      : Math.ceil(periodLengthSeconds / 2 / 60); // Default to middle of period

    // Create timeout record and match event in transaction
    const [timeout] = await prisma.$transaction([
      prisma.timeout.create({
        data: {
          matchId: data.matchId,
          teamId: data.teamId,
          period: data.period,
          timeoutType: data.timeoutType,
          secondsRemaining: data.secondsRemaining,
        },
      }),
      prisma.matchEvent.create({
        data: {
          matchId: data.matchId,
          eventType: 'TIMEOUT',
          minute,
          period: data.period,
          secondsRemaining: data.secondsRemaining,
          sequenceNumber,
          teamId: data.teamId,
          description: `Timeout (${data.timeoutType === 'SIXTY_SECOND' ? '60s' : '30s'})`,
        },
      }),
      prisma.match.update({
        where: { id: data.matchId },
        data: {
          [timeoutField]: currentTimeouts - 1,
          clockRunning: false, // Pause clock on timeout
        },
      }),
    ]);

    return timeout;
  } catch (error) {
    console.error('Error creating timeout:', error);
    return null;
  }
}

/**
 * Create substitution
 */
export async function createSubstitution(data: CreateSubstitutionInput): Promise<Substitution | null> {
  try {
    // Get match and players for event creation
    const match = await prisma.match.findUnique({
      where: { id: data.matchId },
      include: { gameRules: true },
    });

    if (!match) {
      return null;
    }

    // Get sequence numbers for match events
    const { getNextSequenceNumber } = await import('./utils');
    const sequenceNumber = await getNextSequenceNumber(data.matchId, prisma);

    // Calculate minute from secondsRemaining (approximate)
    const periodLengthSeconds = (match.gameRules?.minutesPerPeriod ?? 10) * 60;
    const minute = data.secondsRemaining 
      ? Math.ceil((periodLengthSeconds - data.secondsRemaining) / 60)
      : Math.ceil(periodLengthSeconds / 2 / 60); // Default to middle of period

    // Update player active status and create substitution + events in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update player active status
      await tx.matchPlayer.updateMany({
        where: {
          matchId: data.matchId,
          playerId: data.playerInId,
          teamId: data.teamId,
        },
        data: { isActive: true },
      });
      
      await tx.matchPlayer.updateMany({
        where: {
          matchId: data.matchId,
          playerId: data.playerOutId,
          teamId: data.teamId,
        },
        data: { isActive: false },
      });

      // Create substitution record
      const substitution = await tx.substitution.create({
        data: {
          matchId: data.matchId,
          teamId: data.teamId,
          playerInId: data.playerInId,
          playerOutId: data.playerOutId,
          period: data.period,
          secondsRemaining: data.secondsRemaining,
        },
      });

      // Create SUBSTITUTION_OUT event
      await tx.matchEvent.create({
        data: {
          matchId: data.matchId,
          eventType: 'SUBSTITUTION_OUT',
          minute,
          period: data.period,
          secondsRemaining: data.secondsRemaining,
          sequenceNumber,
          teamId: data.teamId,
          playerId: data.playerOutId,
        },
      });

      // Create SUBSTITUTION_IN event (with next sequence number)
      await tx.matchEvent.create({
        data: {
          matchId: data.matchId,
          eventType: 'SUBSTITUTION_IN',
          minute,
          period: data.period,
          secondsRemaining: data.secondsRemaining,
          sequenceNumber: sequenceNumber + 1,
          teamId: data.teamId,
          playerId: data.playerInId,
        },
      });

      return substitution;
    });

    return result;
  } catch (error) {
    console.error('Error creating substitution:', error);
    return null;
  }
}

/**
 * Create match period
 */
export async function createMatchPeriod(data: CreateMatchPeriodInput): Promise<MatchPeriod | null> {
  try {
    return await prisma.matchPeriod.create({
      data: {
        matchId: data.matchId,
        periodNumber: data.periodNumber,
        startTime: data.startTime,
        team1Score: data.team1Score ?? 0,
        team2Score: data.team2Score ?? 0,
        team1Fouls: data.team1Fouls ?? 0,
        team2Fouls: data.team2Fouls ?? 0,
      },
    });
  } catch (error) {
    console.error('Error creating match period:', error);
    return null;
  }
}

/**
 * Update match period
 */
export async function updateMatchPeriod(
  matchId: string,
  periodNumber: number,
  data: UpdateMatchPeriodInput
): Promise<MatchPeriod | null> {
  try {
    return await prisma.matchPeriod.update({
      where: {
        matchId_periodNumber: {
          matchId,
          periodNumber,
        },
      },
      data,
    });
  } catch (error) {
    console.error('Error updating match period:', error);
    return null;
  }
}

/**
 * End current period and start next period
 */
export async function endPeriod(matchId: string): Promise<boolean> {
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { gameRules: true },
    });

    if (!match) {
      return false;
    }

    const rules = match.gameRules;
    const periodLengthSeconds = (rules?.minutesPerPeriod ?? 10) * 60;
    const nextPeriod = match.currentPeriod + 1;
    const halftimePeriod = rules?.halftimePeriod ?? 2;
    const isHalftime = match.currentPeriod === halftimePeriod;

    // Get sequence number for halftime event if applicable
    let halftimeSequenceNumber: number | null = null;
    if (isHalftime) {
      const { getNextSequenceNumber } = await import('./utils');
      halftimeSequenceNumber = await getNextSequenceNumber(matchId, prisma);
    }

    // End current period
    await updateMatchPeriod(matchId, match.currentPeriod, {
      endTime: new Date(),
      team1Score: match.team1Score ?? 0,
      team2Score: match.team2Score ?? 0,
      team1Fouls: match.team1Fouls,
      team2Fouls: match.team2Fouls,
    });

    // Reset fouls for new period (if needed)
    const resetFouls = true; // Typically fouls reset each period

    // Reset timeouts if configured
    const resetTimeouts = rules?.resetTimeoutsPerPeriod ?? false;
    const timeoutCount = rules?.timeouts60Second ?? 6;

    // Create halftime event if we're at halftime transition
    if (isHalftime && halftimeSequenceNumber !== null) {
      // Calculate minute (end of period = 0 minutes remaining = full period length in minutes)
      const minute = rules?.minutesPerPeriod ?? 10;

      await prisma.matchEvent.create({
        data: {
          matchId,
          eventType: 'BREAK',
          minute,
          period: match.currentPeriod,
          secondsRemaining: 0,
          sequenceNumber: halftimeSequenceNumber,
          teamId: null, // Break events are game-level, not team-specific
          description: `${rules?.halftimeDurationMinutes ?? 15} min`,
        },
      });
    }

    // Start next period
    await prisma.match.update({
      where: { id: matchId },
      data: {
        currentPeriod: nextPeriod,
        clockSeconds: periodLengthSeconds,
        clockRunning: false, // Clock starts paused
        team1Fouls: resetFouls ? 0 : match.team1Fouls,
        team2Fouls: resetFouls ? 0 : match.team2Fouls,
        team1Timeouts: resetTimeouts ? timeoutCount : match.team1Timeouts,
        team2Timeouts: resetTimeouts ? timeoutCount : match.team2Timeouts,
      },
    });

    // Create new period record
    await createMatchPeriod({
      matchId,
      periodNumber: nextPeriod,
      startTime: new Date(),
      team1Score: match.team1Score ?? 0,
      team2Score: match.team2Score ?? 0,
      team1Fouls: resetFouls ? 0 : match.team1Fouls,
      team2Fouls: resetFouls ? 0 : match.team2Fouls,
    });

    // Create "break over" event if we're starting the period after halftime
    if (isHalftime) {
      const { getNextSequenceNumber } = await import('./utils');
      const breakOverSequenceNumber = await getNextSequenceNumber(matchId, prisma);

      await prisma.matchEvent.create({
        data: {
          matchId,
          eventType: 'PLAY_RESUMED',
          minute: 0,
          period: nextPeriod,
          secondsRemaining: periodLengthSeconds,
          sequenceNumber: breakOverSequenceNumber,
          teamId: null, // Play resumed events are game-level, not team-specific
        },
      });
    }

    return true;
  } catch (error) {
    console.error('Error ending period:', error);
    return false;
  }
}

/**
 * Create jump ball
 */
export async function createJumpBall(data: CreateJumpBallInput): Promise<JumpBall | null> {
  try {
    const match = await prisma.match.findUnique({
      where: { id: data.matchId },
      include: { gameRules: true },
    });

    if (!match) {
      return null;
    }

    // Get sequence number for match event
    const { getNextSequenceNumber } = await import('./utils');
    const sequenceNumber = await getNextSequenceNumber(data.matchId, prisma);

    // Calculate minute from secondsRemaining (approximate)
    const periodLengthSeconds = (match.gameRules?.minutesPerPeriod ?? 10) * 60;
    const minute = data.secondsRemaining 
      ? Math.ceil((periodLengthSeconds - data.secondsRemaining) / 60)
      : Math.ceil(periodLengthSeconds / 2 / 60); // Default to middle of period

    // Create jump ball record and match event in transaction
    const [jumpBall] = await prisma.$transaction([
      prisma.jumpBall.create({
        data: {
          matchId: data.matchId,
          period: data.period,
          player1Id: data.player1Id,
          player2Id: data.player2Id,
          possessionTeamId: data.possessionTeamId,
          secondsRemaining: data.secondsRemaining,
        },
      }),
      prisma.matchEvent.create({
        data: {
          matchId: data.matchId,
          eventType: 'JUMP_BALL',
          minute,
          period: data.period,
          secondsRemaining: data.secondsRemaining,
          sequenceNumber,
          description: 'Jump ball',
        },
      }),
      // Update possession if specified
      data.possessionTeamId
        ? prisma.match.update({
            where: { id: data.matchId },
            data: { possessionTeamId: data.possessionTeamId },
          })
        : Promise.resolve(),
    ]);

    return jumpBall;
  } catch (error) {
    console.error('Error creating jump ball:', error);
    return null;
  }
}
