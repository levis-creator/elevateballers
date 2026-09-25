import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type Db = typeof prisma | Prisma.TransactionClient;

/** Thrown when a dropout or reinstatement does not fit the roster's current state; maps to 409. */
export class RosterDropoutError extends Error {
  name = 'RosterDropoutError';
}

const ACTIVE = { leftAt: null, status: { in: ['APPROVED', 'PENDING'] as ('APPROVED' | 'PENDING')[] } };

/**
 * A dropped-out player is off the roster, so take them out of their team's
 * lineups for matches that have not started yet.
 */
async function clearUpcomingLineups(tx: Db, playerId: string, teamId: string) {
  await tx.matchPlayer.deleteMany({ where: { playerId, teamId, match: { status: 'UPCOMING' } } });
}

/**
 * Records that the player left the league: the roster entry is withdrawn (which
 * frees the spot), keeps the reason, and the player leaves upcoming lineups.
 * Used by admins directly and when an admin approves a coach's dropout request.
 */
export async function markRosterDroppedOut(
  tx: Db,
  rosterId: string,
  input: { reason: string | null; changedById: string }
) {
  const roster = await tx.seasonTeamPlayer.findFirst({
    where: { id: rosterId, ...ACTIVE },
    select: { id: true, leagueSeasonId: true, seasonTeamId: true, teamId: true, playerId: true },
  });
  if (!roster) throw new RosterDropoutError('Only a player active on a roster can be marked as dropped out.');
  const now = new Date();
  await tx.seasonTeamPlayer.update({
    where: { id: roster.id },
    data: {
      status: 'WITHDRAWN',
      leftAt: now,
      droppedOutAt: now,
      dropoutReason: input.reason,
      dropoutRequestedAt: null,
    },
  });
  await tx.seasonRosterHistory.create({
    data: {
      leagueSeasonId: roster.leagueSeasonId,
      playerId: roster.playerId,
      seasonTeamId: roster.seasonTeamId,
      rosterId: roster.id,
      action: 'ROSTER_DROPPED_OUT',
      reason: input.reason,
      changedById: input.changedById,
    },
  });
  await clearUpcomingLineups(tx, roster.playerId, roster.teamId);
  return roster;
}

/** Puts a dropped-out player back on the roster they left. */
export async function reinstateRoster(tx: Db, rosterId: string, changedById: string) {
  const roster = await tx.seasonTeamPlayer.findFirst({
    where: { id: rosterId, droppedOutAt: { not: null } },
    select: { id: true, leagueSeasonId: true, seasonTeamId: true, teamId: true, playerId: true, leftAt: true },
  });
  if (!roster || !roster.leftAt) throw new RosterDropoutError('Only a dropped-out player can be reinstated.');
  const elsewhere = await tx.seasonTeamPlayer.findFirst({
    where: { leagueSeasonId: roster.leagueSeasonId, playerId: roster.playerId, id: { not: roster.id }, ...ACTIVE },
    select: { id: true },
  });
  if (elsewhere)
    throw new RosterDropoutError('This player is already on another roster this season, so they cannot be reinstated here.');
  await tx.seasonTeamPlayer.update({
    where: { id: roster.id },
    data: { status: 'APPROVED', leftAt: null, droppedOutAt: null, dropoutReason: null },
  });
  await tx.seasonRosterHistory.create({
    data: {
      leagueSeasonId: roster.leagueSeasonId,
      playerId: roster.playerId,
      seasonTeamId: roster.seasonTeamId,
      rosterId: roster.id,
      action: 'ROSTER_REINSTATED',
      changedById,
    },
  });
  return roster;
}

export type DropoutStatus = { rosterId: string; teamId: string; droppedOutAt: Date; reason: string | null };

/**
 * Players who have left the league: their most recent roster entry is a
 * dropout and they are not active on any roster since.
 */
export async function getDroppedOutPlayers(
  playerIds: readonly string[],
  db: Db = prisma
): Promise<Map<string, DropoutStatus>> {
  const ids = [...new Set(playerIds)];
  if (!ids.length) return new Map();
  const rows = await db.seasonTeamPlayer.findMany({
    where: { playerId: { in: ids }, OR: [{ droppedOutAt: { not: null } }, ACTIVE] },
    select: { id: true, playerId: true, teamId: true, droppedOutAt: true, dropoutReason: true, joinedAt: true },
    orderBy: { joinedAt: 'desc' },
  });
  const out = new Map<string, DropoutStatus>();
  const decided = new Set<string>();
  for (const row of rows) {
    if (decided.has(row.playerId)) continue;
    decided.add(row.playerId);
    if (row.droppedOutAt)
      out.set(row.playerId, {
        rosterId: row.id,
        teamId: row.teamId,
        droppedOutAt: row.droppedOutAt,
        reason: row.dropoutReason,
      });
  }
  return out;
}

/** A player's roster entries an admin can drop out (active) or reinstate (dropped out). */
export async function listPlayerRosters(playerId: string, db: Db = prisma) {
  const rows = await db.seasonTeamPlayer.findMany({
    where: { playerId, OR: [ACTIVE, { droppedOutAt: { not: null } }] },
    select: {
      id: true,
      status: true,
      leftAt: true,
      droppedOutAt: true,
      dropoutReason: true,
      dropoutRequestedAt: true,
      team: { select: { name: true } },
      leagueSeason: { select: { season: { select: { name: true } }, league: { select: { name: true } } } },
    },
    orderBy: { joinedAt: 'desc' },
  });
  return rows.map((row) => ({
    id: row.id,
    teamName: row.team.name,
    edition: [row.leagueSeason.season?.name, row.leagueSeason.league?.name].filter(Boolean).join(' · '),
    status: row.status,
    droppedOut: Boolean(row.droppedOutAt && row.leftAt),
    droppedOutAt: row.droppedOutAt,
    reason: row.dropoutReason,
    dropoutRequested: Boolean(row.dropoutRequestedAt),
  }));
}

/** Drops the player out of every roster they are active on: they have left the league. */
export async function dropOutPlayer(tx: Db, playerId: string, input: { reason: string | null; changedById: string }) {
  const rosters = await tx.seasonTeamPlayer.findMany({ where: { playerId, ...ACTIVE }, select: { id: true, teamId: true } });
  if (!rosters.length) throw new RosterDropoutError('This player is not on any active roster.');
  for (const roster of rosters) await markRosterDroppedOut(tx, roster.id, input);
  return rosters;
}

/** Reinstates the player on the roster they most recently dropped out of. */
export async function reinstatePlayer(tx: Db, playerId: string, changedById: string) {
  const dropout = (await getDroppedOutPlayers([playerId], tx)).get(playerId);
  if (!dropout) throw new RosterDropoutError('This player has not dropped out.');
  return reinstateRoster(tx, dropout.rosterId, changedById);
}
