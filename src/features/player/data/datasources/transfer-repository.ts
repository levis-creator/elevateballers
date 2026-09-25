import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type Db = typeof prisma | Prisma.TransactionClient;

/** Thrown when a transfer does not fit the rosters' current state; maps to 409. */
export class PlayerTransferError extends Error {
  name = 'PlayerTransferError';
}

/**
 * The player's active rosters with the other teams in each edition they could
 * move to, for the admin "Transfer to another team" dialog.
 */
export async function getTransferOptions(playerId: string, db: Db = prisma) {
  const rosters = await db.seasonTeamPlayer.findMany({
    where: { playerId, status: 'APPROVED', leftAt: null },
    select: {
      id: true,
      seasonTeamId: true,
      team: { select: { name: true } },
      leagueSeason: {
        select: {
          id: true,
          season: { select: { name: true } },
          league: { select: { name: true } },
          seasonTeams: { select: { id: true, team: { select: { id: true, name: true } } }, orderBy: { team: { name: 'asc' } } },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });
  return rosters.map((roster) => ({
    rosterId: roster.id,
    edition: [roster.leagueSeason.season?.name, roster.leagueSeason.league?.name].filter(Boolean).join(' · '),
    fromTeam: roster.team.name,
    teams: roster.leagueSeason.seasonTeams
      .filter((seasonTeam) => seasonTeam.id !== roster.seasonTeamId)
      .map((seasonTeam) => ({ seasonTeamId: seasonTeam.id, name: seasonTeam.team.name })),
  }));
}

/**
 * Moves a player to another team in the same edition straight away (an admin
 * is the approver): withdraws the old roster entry, adds an approved one on
 * the new team keeping jersey and position, records the transfer and roster
 * history, moves the player's current team, takes them out of the old team's
 * upcoming lineups and carries open suspensions and injuries to the new team.
 */
export async function transferPlayer(
  tx: Db,
  input: { playerId: string; toSeasonTeamId: string; reason: string | null; changedById: string }
) {
  const target = await tx.seasonTeam.findUnique({
    where: { id: input.toSeasonTeamId },
    select: { id: true, leagueSeasonId: true, teamId: true, team: { select: { name: true } } },
  });
  if (!target) throw new PlayerTransferError('That team is not in this edition.');
  const source = await tx.seasonTeamPlayer.findFirst({
    where: { playerId: input.playerId, leagueSeasonId: target.leagueSeasonId, status: 'APPROVED', leftAt: null },
    select: { id: true, seasonTeamId: true, teamId: true, jerseyNumber: true, position: true, team: { select: { name: true } } },
  });
  if (!source) throw new PlayerTransferError('The player is not on an approved roster in this edition.');
  if (source.seasonTeamId === target.id) throw new PlayerTransferError('The player is already on that team.');

  const now = new Date();
  await tx.seasonTeamPlayer.update({ where: { id: source.id }, data: { status: 'WITHDRAWN', leftAt: now } });
  const clearDropout = { droppedOutAt: null, dropoutReason: null, dropoutRequestedAt: null };
  const destination = await tx.seasonTeamPlayer.upsert({
    where: { seasonTeamId_playerId: { seasonTeamId: target.id, playerId: input.playerId } },
    update: { status: 'APPROVED', leftAt: null, joinedAt: now, jerseyNumber: source.jerseyNumber, position: source.position, ...clearDropout },
    create: {
      leagueSeasonId: target.leagueSeasonId,
      seasonTeamId: target.id,
      teamId: target.teamId,
      playerId: input.playerId,
      status: 'APPROVED',
      jerseyNumber: source.jerseyNumber,
      position: source.position,
    },
    select: { id: true },
  });
  const transfer = await tx.seasonPlayerTransfer.create({
    data: {
      leagueSeasonId: target.leagueSeasonId,
      playerId: input.playerId,
      fromSeasonTeamId: source.seasonTeamId,
      toSeasonTeamId: target.id,
      fromRosterId: source.id,
      toRosterId: destination.id,
      status: 'APPROVED',
      reason: input.reason,
      requestedById: input.changedById,
      reviewedById: input.changedById,
      reviewedAt: now,
    },
    select: { id: true },
  });
  const history = { leagueSeasonId: target.leagueSeasonId, playerId: input.playerId, fromTeamId: source.seasonTeamId, toTeamId: target.id, reason: input.reason, changedById: input.changedById };
  await tx.seasonRosterHistory.createMany({
    data: [
      { ...history, seasonTeamId: source.seasonTeamId, rosterId: source.id, action: 'TRANSFER_OUT' },
      { ...history, seasonTeamId: target.id, rosterId: destination.id, action: 'TRANSFER_IN' },
    ],
  });

  // The player's current team drives public squads and team history.
  const player = await tx.player.findUnique({ where: { id: input.playerId }, select: { teamId: true } });
  if (player?.teamId !== target.teamId) {
    await tx.player.update({ where: { id: input.playerId }, data: { teamId: target.teamId } });
    if (player?.teamId)
      await tx.playerTeamHistory.updateMany({ where: { playerId: input.playerId, teamId: player.teamId, leftAt: null }, data: { leftAt: now } });
    await tx.playerTeamHistory.create({ data: { playerId: input.playerId, teamId: target.teamId, joinedAt: now } });
  }
  await tx.matchPlayer.deleteMany({ where: { playerId: input.playerId, teamId: source.teamId, match: { status: 'UPCOMING' } } });
  // A suspension is served in the player's team's matches, so it follows them.
  await tx.playerAvailability.updateMany({
    where: { playerId: input.playerId, teamId: source.teamId, resolvedAt: null },
    data: { teamId: target.teamId },
  });

  return {
    transferId: transfer.id,
    fromTeamId: source.teamId,
    fromTeamName: source.team.name,
    toTeamId: target.teamId,
    toTeamName: target.team.name,
  };
}
