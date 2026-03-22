import { prisma } from '../../../../lib/prisma';
import { getEnvBoolean } from '../../../../lib/env';
import type {
  CreateMatchInput,
  UpdateMatchInput,
  Match,
  CreateMatchEventInput,
  UpdateMatchEventInput,
  MatchEvent,
  CreateMatchPlayerInput,
  UpdateMatchPlayerInput,
  MatchPlayer,
} from '@/lib/types';

// ─── Match mutations ───────────────────────────────────────────────────────────

export async function createMatch(data: CreateMatchInput): Promise<Match> {
  if (data.team1Id && data.team2Id && data.team1Id === data.team2Id) {
    throw new Error('A team cannot be matched against itself');
  }

  if (
    !data.team1Id && !data.team2Id &&
    data.team1Name && data.team2Name &&
    data.team1Name === data.team2Name &&
    data.team1Name !== 'TBD' && data.team2Name !== 'TBD' &&
    data.team1Name !== 'BYE' && data.team2Name !== 'BYE'
  ) {
    throw new Error('A team cannot be matched against itself');
  }

  const matchData: any = {
    date: new Date(data.date),
    team1Score: data.team1Score,
    team2Score: data.team2Score,
    status: data.status || 'UPCOMING',
  };

  if (data.stage && data.stage.trim() !== '') matchData.stage = data.stage;

  if (data.leagueId) {
    matchData.league = { connect: { id: data.leagueId } };
  } else {
    matchData.leagueName = data.league || '';
  }

  if (data.seasonId) matchData.season = { connect: { id: data.seasonId } };

  if (data.team1Id) {
    matchData.team1 = { connect: { id: data.team1Id } };
  } else {
    matchData.team1Name = data.team1Name || '';
    matchData.team1Logo = data.team1Logo || '';
  }

  if (data.team2Id) {
    matchData.team2 = { connect: { id: data.team2Id } };
  } else {
    matchData.team2Name = data.team2Name || '';
    matchData.team2Logo = data.team2Logo || '';
  }

  if (data.nextWinnerMatchId !== undefined) matchData.nextWinnerMatchId = data.nextWinnerMatchId;
  if (data.nextLoserMatchId !== undefined) matchData.nextLoserMatchId = data.nextLoserMatchId;
  if (data.bracketPosition !== undefined) matchData.bracketPosition = data.bracketPosition;
  if (data.bracketRound !== undefined) matchData.bracketRound = data.bracketRound;
  if (data.bracketType !== undefined) matchData.bracketType = data.bracketType;

  return await prisma.match.create({
    data: matchData,
    // @ts-expect-error - Prisma types will be correct after full sync
    include: { team1: true, team2: true, league: true, season: true },
  });
}

export async function updateMatch(id: string, data: UpdateMatchInput): Promise<Match | null> {
  const updateData: any = {};

  if (data.date) updateData.date = new Date(data.date);
  if (data.team1Score !== undefined) updateData.team1Score = data.team1Score;
  if (data.team2Score !== undefined) updateData.team2Score = data.team2Score;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.duration !== undefined) updateData.duration = data.duration;

  if (data.stage !== undefined) {
    updateData.stage = data.stage && data.stage.trim() !== '' ? data.stage : null;
  }

  if (data.leagueId !== undefined) {
    if (data.leagueId) {
      updateData.leagueId = data.leagueId;
      updateData.leagueName = null;
    } else {
      updateData.leagueId = null;
      updateData.leagueName = data.league || '';
    }
  } else if (data.league !== undefined) {
    updateData.leagueName = data.league;
  }

  if (data.seasonId !== undefined) {
    updateData.seasonId = data.seasonId || null;
  }

  if (data.team1Id !== undefined) {
    if (data.team1Id) {
      updateData.team1Id = data.team1Id;
      updateData.team1Name = null;
      updateData.team1Logo = null;
    } else {
      updateData.team1Id = null;
      updateData.team1Name = data.team1Name || '';
      updateData.team1Logo = data.team1Logo || '';
    }
  } else if (data.team1Name !== undefined || data.team1Logo !== undefined) {
    if (data.team1Name !== undefined) updateData.team1Name = data.team1Name;
    if (data.team1Logo !== undefined) updateData.team1Logo = data.team1Logo;
  }

  if (data.team2Id !== undefined) {
    if (data.team2Id) {
      updateData.team2Id = data.team2Id;
      updateData.team2Name = null;
      updateData.team2Logo = null;
    } else {
      updateData.team2Id = null;
      updateData.team2Name = data.team2Name || '';
      updateData.team2Logo = data.team2Logo || '';
    }
  } else if (data.team2Name !== undefined || data.team2Logo !== undefined) {
    if (data.team2Name !== undefined) updateData.team2Name = data.team2Name;
    if (data.team2Logo !== undefined) updateData.team2Logo = data.team2Logo;
  }

  try {
    const currentMatch = await prisma.match.findUnique({
      where: { id },
      select: { status: true },
    });

    const updatedMatch = await prisma.match.update({
      where: { id },
      data: updateData,
      // @ts-expect-error - Prisma types will be correct after full sync
      include: { team1: true, team2: true, league: true, season: true },
    });

    const statusChangedToCompleted =
      data.status === 'COMPLETED' && currentMatch?.status !== 'COMPLETED';
    const scoresUpdatedOnCompletedMatch =
      currentMatch?.status === 'COMPLETED' &&
      (data.team1Score !== undefined || data.team2Score !== undefined);

    if (statusChangedToCompleted || scoresUpdatedOnCompletedMatch) {
      const { updateMatchWinner } = await import('@/features/game-tracking/domain/usecases/score-calculation');
      await updateMatchWinner(id, prisma);

      if (getEnvBoolean('ENABLE_AUTOMATCHING', true)) {
        const { advanceWinnerToNextMatch } = await import('@/features/tournaments/domain/usecases/bracket-automation');
        await advanceWinnerToNextMatch(id, prisma);
      }
    }

    return updatedMatch;
  } catch (error) {
    console.error('Error updating match:', error);
    return null;
  }
}

export async function deleteMatch(id: string): Promise<boolean> {
  try {
    await prisma.match.delete({ where: { id } });
    return true;
  } catch (error) {
    console.error('Error deleting match:', error);
    return false;
  }
}

// ─── Match event mutations ─────────────────────────────────────────────────────

export async function createMatchEvent(data: CreateMatchEventInput): Promise<MatchEvent | null> {
  try {
    const { isScoringEvent, updateMatchScoresFromEvents } = await import(
      '@/features/game-tracking/domain/usecases/score-calculation'
    );

    let period = data.period;
    let secondsRemaining = data.secondsRemaining;

    if (period === undefined || secondsRemaining === undefined) {
      const match = await prisma.match.findUnique({
        where: { id: data.matchId },
        select: { currentPeriod: true, clockSeconds: true },
      });
      if (match) {
        period = period ?? match.currentPeriod;
        secondsRemaining = secondsRemaining ?? match.clockSeconds ?? undefined;
      } else {
        period = period ?? 1;
      }
    }

    const { getNextSequenceNumber } = await import('@/features/game-tracking/domain/usecases/utils');
    const sequenceNumber = await getNextSequenceNumber(data.matchId, prisma);

    const isScoring = isScoringEvent(data.eventType);

    if (data.eventType === 'PLAY_RESUMED') {
      const match = await prisma.match.findUnique({ where: { id: data.matchId }, include: { gameRules: true } });
      if (match) {
        const rules = match.gameRules;
        const periodLengthSeconds = (rules?.minutesPerPeriod ?? 10) * 60;
        const targetPeriod = period ?? match.currentPeriod;
        const targetSeconds = secondsRemaining ?? periodLengthSeconds;

        return await prisma.$transaction(async (tx) => {
          await tx.match.update({
            where: { id: data.matchId },
            data: { currentPeriod: targetPeriod, clockSeconds: targetSeconds, clockRunning: false },
          });
          const event = await tx.matchEvent.create({
            data: {
              matchId: data.matchId, eventType: data.eventType, minute: data.minute,
              period: targetPeriod, secondsRemaining: targetSeconds, sequenceNumber,
              teamId: data.teamId, playerId: data.playerId, assistPlayerId: data.assistPlayerId,
              description: data.description, metadata: data.metadata,
            },
          });
          if (isScoring) await updateMatchScoresFromEvents(data.matchId, tx);
          return event;
        });
      }
    }

    if (isScoring) {
      return await prisma.$transaction(async (tx) => {
        const event = await tx.matchEvent.create({
          data: {
            matchId: data.matchId, eventType: data.eventType, minute: data.minute,
            period: period ?? 1, secondsRemaining: secondsRemaining ?? null, sequenceNumber,
            teamId: data.teamId, playerId: data.playerId, assistPlayerId: data.assistPlayerId,
            description: data.description, metadata: data.metadata,
          },
        });
        await updateMatchScoresFromEvents(data.matchId, tx);
        return event;
      });
    }

    if (data.eventType === 'SUBSTITUTION_IN' || data.eventType === 'SUBSTITUTION_OUT') {
      return await prisma.$transaction(async (tx) => {
        if (data.playerId && data.teamId) {
          await tx.matchPlayer.updateMany({
            where: { matchId: data.matchId, playerId: data.playerId, teamId: data.teamId },
            data: { isActive: data.eventType === 'SUBSTITUTION_IN', subOut: data.eventType === 'SUBSTITUTION_OUT' },
          });
        }
        return await tx.matchEvent.create({
          data: {
            matchId: data.matchId, eventType: data.eventType, minute: data.minute,
            period: period ?? 1, secondsRemaining: secondsRemaining ?? null, sequenceNumber,
            teamId: data.teamId, playerId: data.playerId, assistPlayerId: data.assistPlayerId,
            description: data.description, metadata: data.metadata,
          },
        });
      });
    }

    return await prisma.matchEvent.create({
      data: {
        matchId: data.matchId, eventType: data.eventType, minute: data.minute,
        period: period ?? 1, secondsRemaining: secondsRemaining ?? null, sequenceNumber,
        teamId: data.teamId, playerId: data.playerId, assistPlayerId: data.assistPlayerId,
        description: data.description, metadata: data.metadata,
      },
    });
  } catch (error) {
    console.error('Error creating match event:', error);
    return null;
  }
}

export async function updateMatchEvent(
  id: string,
  data: UpdateMatchEventInput
): Promise<MatchEvent | null> {
  try {
    const { isScoringEvent, updateMatchScoresFromEvents } = await import(
      '@/features/game-tracking/domain/usecases/score-calculation'
    );

    const existingEvent = await prisma.matchEvent.findUnique({
      where: { id },
      select: { eventType: true, matchId: true, isUndone: true },
    });
    if (!existingEvent) return null;

    const wasScoringEvent = isScoringEvent(existingEvent.eventType);
    const isNowScoringEvent = data.eventType ? isScoringEvent(data.eventType) : wasScoringEvent;
    const isUndoneChanged = data.isUndone !== undefined && data.isUndone !== existingEvent.isUndone;
    const eventTypeChanged = data.eventType !== undefined && data.eventType !== existingEvent.eventType;
    const needsScoreRecalculation = (wasScoringEvent || isNowScoringEvent) && (isUndoneChanged || eventTypeChanged);

    if (existingEvent.eventType === 'PLAY_RESUMED' && (data.period !== undefined || data.secondsRemaining !== undefined)) {
      const match = await prisma.match.findUnique({ where: { id: existingEvent.matchId }, include: { gameRules: true } });
      if (match) {
        const rules = match.gameRules;
        const periodLengthSeconds = (rules?.minutesPerPeriod ?? 10) * 60;
        const targetPeriod = data.period ?? match.currentPeriod;
        const targetSeconds = data.secondsRemaining ?? periodLengthSeconds;

        return await prisma.$transaction(async (tx) => {
          await tx.match.update({ where: { id: existingEvent.matchId }, data: { currentPeriod: targetPeriod, clockSeconds: targetSeconds } });
          const updatedEvent = await tx.matchEvent.update({ where: { id }, data: { ...data, period: targetPeriod, secondsRemaining: targetSeconds } });
          if (needsScoreRecalculation) await updateMatchScoresFromEvents(existingEvent.matchId, tx);
          return updatedEvent;
        });
      }
    }

    if (needsScoreRecalculation) {
      return await prisma.$transaction(async (tx) => {
        const updatedEvent = await tx.matchEvent.update({ where: { id }, data });
        await updateMatchScoresFromEvents(existingEvent.matchId, tx);
        return updatedEvent;
      });
    }

    return await prisma.matchEvent.update({ where: { id }, data });
  } catch (error) {
    console.error('Error updating match event:', error);
    return null;
  }
}

export async function deleteMatchEvent(id: string): Promise<boolean> {
  try {
    const { isScoringEvent, updateMatchScoresFromEvents } = await import(
      '@/features/game-tracking/domain/usecases/score-calculation'
    );

    const existingEvent = await prisma.matchEvent.findUnique({
      where: { id },
      select: { eventType: true, matchId: true },
    });
    if (!existingEvent) return false;

    const wasScoringEvent = isScoringEvent(existingEvent.eventType);

    if (existingEvent.eventType === 'SUBSTITUTION_IN' || existingEvent.eventType === 'SUBSTITUTION_OUT') {
      const eventWithPlayer = await prisma.matchEvent.findUnique({ where: { id }, select: { playerId: true, teamId: true } });
      await prisma.$transaction(async (tx) => {
        if (eventWithPlayer?.playerId && eventWithPlayer.teamId) {
          await tx.matchPlayer.updateMany({
            where: { matchId: existingEvent.matchId, playerId: eventWithPlayer.playerId, teamId: eventWithPlayer.teamId },
            data: { isActive: existingEvent.eventType === 'SUBSTITUTION_OUT' },
          });
        }
        await tx.matchEvent.delete({ where: { id } });
      });
    } else if (wasScoringEvent) {
      await prisma.$transaction(async (tx) => {
        await tx.matchEvent.delete({ where: { id } });
        await updateMatchScoresFromEvents(existingEvent.matchId, tx);
      });
    } else {
      await prisma.matchEvent.delete({ where: { id } });
    }

    return true;
  } catch (error) {
    console.error('Error deleting match event:', error);
    return false;
  }
}

// ─── Match player mutations ────────────────────────────────────────────────────

export async function createMatchPlayer(data: CreateMatchPlayerInput): Promise<MatchPlayer | null> {
  try {
    return await prisma.matchPlayer.create({
      data: {
        matchId: data.matchId,
        playerId: data.playerId,
        teamId: data.teamId,
        started: data.started ?? true,
        isActive: data.isActive ?? true,
        position: data.position,
        jerseyNumber: data.jerseyNumber,
        minutesPlayed: data.minutesPlayed,
        subOut: data.subOut ?? false,
      },
    });
  } catch (error) {
    console.error('Error creating match player:', error);
    return null;
  }
}

export async function updateMatchPlayer(
  id: string,
  data: UpdateMatchPlayerInput
): Promise<MatchPlayer | null> {
  try {
    const updateData: any = { ...data };
    if (data.started !== undefined) updateData.isActive = data.started;
    if (data.subOut !== undefined) updateData.subOut = data.subOut;

    return await prisma.matchPlayer.update({ where: { id }, data: updateData });
  } catch (error) {
    console.error('Error updating match player:', error);
    return null;
  }
}

export async function deleteMatchPlayer(id: string): Promise<boolean> {
  try {
    await prisma.matchPlayer.delete({ where: { id } });
    return true;
  } catch (error) {
    console.error('Error deleting match player:', error);
    return false;
  }
}
