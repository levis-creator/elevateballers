import { prisma } from '../../../../../lib/prisma';
import type { CreateMatchEventInput, UpdateMatchEventInput, MatchEvent } from '../../../types';

export async function createMatchEvent(data: CreateMatchEventInput): Promise<MatchEvent | null> {
  const event = await insertMatchEvent(data);
  if (event?.eventType === 'EJECTION') await syncEjection(event.id);
  return event;
}

/** An ejection suspends the player for their team's next match; keep that in step with the event. */
async function syncEjection(eventId: string): Promise<void> {
  try {
    const { syncEjectionSuspension } = await import('../../../../player/data/datasources/availability-repository');
    await syncEjectionSuspension(eventId);
  } catch (error) {
    console.error('Error syncing ejection suspension:', error);
  }
}

/** Client id the live console stamps on each event, used to ignore retries. */
function clientIdOf(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  const cid = (metadata as Record<string, unknown>).cid;
  return typeof cid === 'string' && cid.length > 0 ? cid : null;
}

/** The event already saved under this idempotency key, if any. */
function findByClientId(matchId: string, clientId: string) {
  return prisma.matchEvent.findUnique({ where: { matchId_clientId: { matchId, clientId } } });
}

const isUniqueViolation = (error: unknown) =>
  !!error && typeof error === 'object' && (error as { code?: string }).code === 'P2002';

async function insertMatchEvent(data: CreateMatchEventInput): Promise<MatchEvent | null> {
  // Idempotency: a retried send (reply lost on a flaky courtside connection)
  // returns the event already saved. The unique (match_id, client_id) index
  // backs this up if two copies ever race.
  const cid = clientIdOf(data.metadata);
  try {
    const { isScoringEvent, updateMatchScoresFromEvents, isFoulEvent, updateMatchFoulsFromEvents } = await import(
      '../../../../game-tracking/lib/score-calculation'
    );
    const { getNextSequenceNumber, lockMatchForEvents } = await import('../../../../game-tracking/lib/utils');
    const isScoring = isScoringEvent(data.eventType);
    const isFoul = isFoulEvent(data.eventType);

    // One transaction per event: lock the match, then check the key, number
    // the event and insert it, so concurrent writers can't share a sequence.
    return await prisma.$transaction(
      async (tx) => {
        await lockMatchForEvents(tx, data.matchId);
        if (cid) {
          const existing = await tx.matchEvent.findUnique({ where: { matchId_clientId: { matchId: data.matchId, clientId: cid } } });
          if (existing) return existing;
        }

        let period = data.period;
        let secondsRemaining = data.secondsRemaining;
        if (period === undefined || secondsRemaining === undefined || data.eventType === 'PLAY_RESUMED') {
          const match = await tx.match.findUnique({
            where: { id: data.matchId },
            select: { currentPeriod: true, clockSeconds: true, gameRules: { select: { minutesPerPeriod: true } } },
          });
          period = period ?? match?.currentPeriod ?? 1;
          if (data.eventType === 'PLAY_RESUMED') {
            // Resuming play resets the clock to the given time, or a full period.
            secondsRemaining = secondsRemaining ?? (match?.gameRules?.minutesPerPeriod ?? 10) * 60;
            await tx.match.update({
              where: { id: data.matchId },
              data: { currentPeriod: period, clockSeconds: secondsRemaining, clockRunning: false },
            });
          } else {
            secondsRemaining = secondsRemaining ?? match?.clockSeconds ?? undefined;
          }
        }

        if ((data.eventType === 'SUBSTITUTION_IN' || data.eventType === 'SUBSTITUTION_OUT') && data.playerId && data.teamId) {
          await tx.matchPlayer.updateMany({
            where: { matchId: data.matchId, playerId: data.playerId, teamId: data.teamId },
            data: { isActive: data.eventType === 'SUBSTITUTION_IN', subOut: data.eventType === 'SUBSTITUTION_OUT' },
          });
        }

        const sequenceNumber = await getNextSequenceNumber(data.matchId, tx);
        const event = await tx.matchEvent.create({
          data: {
            matchId: data.matchId, eventType: data.eventType, minute: data.minute,
            period: period ?? 1, secondsRemaining: secondsRemaining ?? null, sequenceNumber,
            teamId: data.teamId, playerId: data.playerId, assistPlayerId: data.assistPlayerId,
            description: data.description, metadata: data.metadata, clientId: cid,
          },
        });
        if (isScoring) await updateMatchScoresFromEvents(data.matchId, tx);
        if (isFoul) await updateMatchFoulsFromEvents(data.matchId, tx);
        return event;
      },
      { timeout: 15000 },
    );
  } catch (error) {
    if (cid && isUniqueViolation(error)) return await findByClientId(data.matchId, cid);
    console.error('Error creating match event:', error);
    return null;
  }
}

export async function updateMatchEvent(
  id: string,
  data: UpdateMatchEventInput
): Promise<MatchEvent | null> {
  const before = await prisma.matchEvent.findUnique({ where: { id }, select: { eventType: true } });
  const event = await applyMatchEventUpdate(id, data);
  if (event && (before?.eventType === 'EJECTION' || event.eventType === 'EJECTION')) await syncEjection(id);
  return event;
}

async function applyMatchEventUpdate(id: string, data: UpdateMatchEventInput): Promise<MatchEvent | null> {
  try {
    const { isScoringEvent, updateMatchScoresFromEvents, isFoulEvent, updateMatchFoulsFromEvents } = await import(
      '../../../../game-tracking/lib/score-calculation'
    );
    // Same lock order as inserts (match row first) so writers never deadlock.
    const { lockMatchForEvents } = await import('../../../../game-tracking/lib/utils');

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
          await lockMatchForEvents(tx, existingEvent.matchId);
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
        await lockMatchForEvents(tx, existingEvent.matchId);
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
      '../../../../game-tracking/lib/score-calculation'
    );
    // Same lock order as inserts (match row first) so writers never deadlock.
    const { lockMatchForEvents } = await import('../../../../game-tracking/lib/utils');

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
        await lockMatchForEvents(tx, existingEvent.matchId);
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
        await lockMatchForEvents(tx, existingEvent.matchId);
        await tx.matchEvent.delete({ where: { id } });
        await updateMatchScoresFromEvents(existingEvent.matchId, tx);
      });
    } else if (wasFoulEvent) {
      await prisma.$transaction(async (tx) => {
        await lockMatchForEvents(tx, existingEvent.matchId);
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
