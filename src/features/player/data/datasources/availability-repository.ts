import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  EJECTION_SUSPENSION_MATCHES,
  blocksMatch,
  describe,
  isActive,
  unavailableMessage,
  type AvailabilityRecord,
  type AvailabilityStatus,
  type TeamMatch,
} from '../../domain/availability';

type Db = typeof prisma | Prisma.TransactionClient;

/** Thrown when a suspended or injured player is put into a match squad; maps to 409. */
export class PlayerUnavailableError extends Error {
  name = 'PlayerUnavailableError';
}

const recordSelect = {
  id: true,
  playerId: true,
  teamId: true,
  type: true,
  reason: true,
  matchCount: true,
  startsAfter: true,
  sourceMatchId: true,
  resolvedAt: true,
} as const;

// An ejection suspension only stands while its ejection does: undoing the
// event (or retyping it) lifts it without anyone having to remember to.
const standingRecords: Prisma.PlayerAvailabilityWhereInput = {
  resolvedAt: null,
  OR: [{ sourceEventId: null }, { sourceEvent: { isUndone: false, eventType: 'EJECTION' } }],
};

async function openRecords(db: Db, playerIds: readonly string[]): Promise<AvailabilityRecord[]> {
  if (!playerIds.length) return [];
  return db.playerAvailability.findMany({
    where: { ...standingRecords, playerId: { in: [...new Set(playerIds)] } },
    select: recordSelect,
    orderBy: { createdAt: 'asc' },
  });
}

/** The matches of every team the records name, from the earliest start onwards. */
async function teamMatchesFor(db: Db, records: readonly AvailabilityRecord[]): Promise<TeamMatch[]> {
  const suspensions = records.filter((r) => r.type === 'SUSPENSION' && r.teamId);
  if (!suspensions.length) return [];
  const teamIds = [...new Set(suspensions.map((r) => r.teamId!))];
  const from = new Date(Math.min(...suspensions.map((r) => r.startsAfter.getTime())));
  return db.match.findMany({
    where: { date: { gt: from }, OR: [{ team1Id: { in: teamIds } }, { team2Id: { in: teamIds } }] },
    select: { id: true, date: true, status: true, team1Id: true, team2Id: true },
  });
}

/** Current suspensions and injuries for each player (players with none are absent). */
export async function getActiveAvailability(
  playerIds: readonly string[],
  db: Db = prisma
): Promise<Map<string, AvailabilityStatus[]>> {
  const records = await openRecords(db, playerIds);
  const matches = await teamMatchesFor(db, records);
  const out = new Map<string, AvailabilityStatus[]>();
  for (const record of records) {
    if (!isActive(record, matches)) continue;
    out.set(record.playerId, [...(out.get(record.playerId) ?? []), describe(record, matches)]);
  }
  return out;
}

/** For each player ruled out of `matchId`, the record that rules them out. */
export async function getBlockedPlayers(
  db: Db,
  matchId: string,
  playerIds: readonly string[]
): Promise<Map<string, AvailabilityRecord>> {
  const records = await openRecords(db, playerIds);
  if (!records.length) return new Map();
  const [match, matches] = await Promise.all([
    db.match.findUnique({
      where: { id: matchId },
      select: { id: true, date: true, status: true, team1Id: true, team2Id: true },
    }),
    teamMatchesFor(db, records),
  ]);
  const out = new Map<string, AvailabilityRecord>();
  if (!match) return out;
  for (const record of records)
    if (!out.has(record.playerId) && blocksMatch(record, match, matches)) out.set(record.playerId, record);
  return out;
}

/** Throws PlayerUnavailableError if any of the players is suspended for or injured before `matchId`. */
export async function assertPlayersAvailable(db: Db, matchId: string, playerIds: readonly string[]): Promise<void> {
  const blocked = await getBlockedPlayers(db, matchId, playerIds);
  const [first] = blocked.values();
  if (!first) return;
  const player = await db.player.findUnique({
    where: { id: first.playerId },
    select: { firstName: true, lastName: true },
  });
  const name = `${player?.firstName ?? ''} ${player?.lastName ?? ''}`.trim() || 'This player';
  throw new PlayerUnavailableError(unavailableMessage(name, first));
}

/**
 * Keeps an ejection's automatic one-match suspension in step with the event:
 * creates it for an ejection, retargets it if the event's player changes and
 * removes it if the event is no longer an ejection. Undone ejections are
 * ignored by the read side, so a redo restores the suspension.
 */
export async function syncEjectionSuspension(eventId: string, db: Db = prisma): Promise<void> {
  const event = await db.matchEvent.findUnique({
    where: { id: eventId },
    select: { id: true, eventType: true, playerId: true, teamId: true, matchId: true, match: { select: { date: true } } },
  });
  if (!event) return;
  if (event.eventType !== 'EJECTION' || !event.playerId) {
    await db.playerAvailability.deleteMany({ where: { sourceEventId: eventId } });
    return;
  }
  const player = await db.player.findUnique({ where: { id: event.playerId }, select: { teamId: true } });
  const target = {
    playerId: event.playerId,
    teamId: event.teamId ?? player?.teamId ?? null,
    startsAfter: event.match.date,
    sourceMatchId: event.matchId,
  };
  await db.playerAvailability.upsert({
    where: { sourceEventId: eventId },
    create: {
      ...target,
      type: 'SUSPENSION',
      matchCount: EJECTION_SUSPENSION_MATCHES,
      reason: 'Ejected',
      sourceEventId: eventId,
    },
    update: target,
  });
}

/** Every suspension and injury on record for a player, newest first, with its current state. */
export async function listPlayerAvailability(playerId: string, db: Db = prisma) {
  const rows = await db.playerAvailability.findMany({
    where: { playerId },
    select: {
      ...recordSelect,
      createdAt: true,
      sourceEvent: { select: { isUndone: true, eventType: true } },
      team: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  const matches = await teamMatchesFor(db, rows);
  return rows.map(({ sourceEvent, team, ...record }) => {
    const voided = sourceEvent ? sourceEvent.isUndone || sourceEvent.eventType !== 'EJECTION' : false;
    const effective = voided ? { ...record, resolvedAt: record.resolvedAt ?? record.createdAt } : record;
    return {
      ...describe(effective, matches),
      teamName: team?.name ?? null,
      matchCount: record.matchCount,
      automatic: Boolean(record.sourceMatchId),
      createdAt: record.createdAt,
      resolvedAt: record.resolvedAt,
      active: !voided && isActive(effective, matches),
    };
  });
}

export async function createSuspension(input: {
  playerId: string;
  matchCount: number;
  reason: string | null;
  createdById: string;
  db?: Db;
}) {
  const db = input.db ?? prisma;
  const player = await db.player.findUnique({ where: { id: input.playerId }, select: { teamId: true } });
  if (!player) return null;
  if (!player.teamId) throw new PlayerUnavailableError('This player is not on a team, so there are no matches to suspend them for.');
  return db.playerAvailability.create({
    data: {
      playerId: input.playerId,
      teamId: player.teamId,
      type: 'SUSPENSION',
      matchCount: input.matchCount,
      reason: input.reason,
      createdById: input.createdById,
    },
    select: recordSelect,
  });
}

/** Marks a player injured; an existing open injury is kept (with the new note, if any). */
export async function reportInjury(input: {
  playerId: string;
  teamId: string | null;
  reason: string | null;
  createdById: string;
  db?: Db;
}) {
  const db = input.db ?? prisma;
  const open = await db.playerAvailability.findFirst({
    where: { playerId: input.playerId, type: 'INJURY', resolvedAt: null },
    select: { id: true },
  });
  if (open)
    return db.playerAvailability.update({
      where: { id: open.id },
      data: input.reason ? { reason: input.reason } : {},
      select: recordSelect,
    });
  return db.playerAvailability.create({
    data: {
      playerId: input.playerId,
      teamId: input.teamId,
      type: 'INJURY',
      reason: input.reason,
      createdById: input.createdById,
    },
    select: recordSelect,
  });
}

/** Marks every open injury for the player as healed; returns how many were closed. */
export async function markFit(playerId: string, resolvedById: string, db: Db = prisma): Promise<number> {
  const { count } = await db.playerAvailability.updateMany({
    where: { playerId, type: 'INJURY', resolvedAt: null },
    data: { resolvedAt: new Date(), resolvedById },
  });
  return count;
}

/** Ends one record early (an admin lifting a suspension, or clearing an injury). */
export async function resolveAvailability(id: string, playerId: string, resolvedById: string, db: Db = prisma) {
  const { count } = await db.playerAvailability.updateMany({
    where: { id, playerId, resolvedAt: null },
    data: { resolvedAt: new Date(), resolvedById },
  });
  return count > 0;
}
