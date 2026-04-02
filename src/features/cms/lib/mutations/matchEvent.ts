import { prisma } from '../../../../lib/prisma';
import type { CreateMatchEventInput, UpdateMatchEventInput, MatchEvent } from '../../types';

export async function bulkCreateMatchEvents(
  matchId: string,
  events: Omit<CreateMatchEventInput, 'matchId'>[]
): Promise<{ created: number; errors: { row: number; message: string }[] }> {
  const errors: { row: number; message: string }[] = [];
  let created = 0;

  for (let i = 0; i < events.length; i++) {
    try {
      const result = await createMatchEvent({ ...events[i], matchId });
      if (result) {
        created++;
      } else {
        errors.push({ row: i + 1, message: 'Failed to create event' });
      }
    } catch (err: any) {
      errors.push({ row: i + 1, message: err?.message ?? 'Unknown error' });
    }
  }

  return { created, errors };
}

export async function createMatchEvent(data: CreateMatchEventInput): Promise<MatchEvent | null> {
  try {
    const { isScoringEvent, updateMatchScoresFromEvents, isFoulEvent, updateMatchFoulsFromEvents } = await import(
      '../../../game-tracking/lib/score-calculation'
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

    const { getNextSequenceNumber } = await import('../../../game-tracking/lib/utils');
    const sequenceNumber = await getNextSequenceNumber(data.matchId, prisma);

    const isScoring = isScoringEvent(data.eventType);
    const isFoul   = isFoulEvent(data.eventType);

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

    // Foul events — create then recalculate the current-period team foul totals
    if (isFoul) {
      return await prisma.$transaction(async (tx) => {
        const event = await tx.matchEvent.create({
          data: {
            matchId: data.matchId, eventType: data.eventType, minute: data.minute,
            period: period ?? 1, secondsRemaining: secondsRemaining ?? null, sequenceNumber,
            teamId: data.teamId, playerId: data.playerId, assistPlayerId: data.assistPlayerId,
            description: data.description, metadata: data.metadata,
          },
        });
        await updateMatchFoulsFromEvents(data.matchId, tx);
        return event;
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
    const { isScoringEvent, updateMatchScoresFromEvents, isFoulEvent, updateMatchFoulsFromEvents } = await import(
      '../../../game-tracking/lib/score-calculation'
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

    // Foul recalculation needed when the event is a foul AND its isUndone status or type changes
    const wasFoulEvent = isFoulEvent(existingEvent.eventType);
    const isNowFoulEvent = data.eventType ? isFoulEvent(data.eventType) : wasFoulEvent;
    const needsFoulRecalculation = (wasFoulEvent || isNowFoulEvent) && (isUndoneChanged || eventTypeChanged);

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
          if (needsFoulRecalculation) await updateMatchFoulsFromEvents(existingEvent.matchId, tx);
          return updatedEvent;
        });
      }
    }

    if (needsScoreRecalculation || needsFoulRecalculation) {
      return await prisma.$transaction(async (tx) => {
        const updatedEvent = await tx.matchEvent.update({ where: { id }, data });
        if (needsScoreRecalculation) await updateMatchScoresFromEvents(existingEvent.matchId, tx);
        if (needsFoulRecalculation) await updateMatchFoulsFromEvents(existingEvent.matchId, tx);
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
    const { isScoringEvent, updateMatchScoresFromEvents, isFoulEvent, updateMatchFoulsFromEvents } = await import(
      '../../../game-tracking/lib/score-calculation'
    );

    const existingEvent = await prisma.matchEvent.findUnique({
      where: { id },
      select: { eventType: true, matchId: true },
    });
    if (!existingEvent) return false;

    const wasScoringEvent = isScoringEvent(existingEvent.eventType);
    const wasFoulEvent    = isFoulEvent(existingEvent.eventType);

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
    } else if (wasFoulEvent) {
      await prisma.$transaction(async (tx) => {
        await tx.matchEvent.delete({ where: { id } });
        await updateMatchFoulsFromEvents(existingEvent.matchId, tx);
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
