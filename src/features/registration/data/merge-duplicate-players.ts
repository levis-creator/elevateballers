import { prisma } from '../../../lib/prisma';

export class DuplicateMergeConflict extends Error {
  name = 'DuplicateMergeConflict';
  constructor(public conflicts: string[]) {
    super('These records cannot be merged automatically because they would collide:');
  }
}

const duplicateKeyFor = (player: { email: string | null; firstName: string | null; lastName: string | null }) =>
  player.email?.trim().toLowerCase() || `${player.firstName?.trim().toLowerCase()}::${player.lastName?.trim().toLowerCase()}`;

const pairKey = (...values: (string | null)[]) => values.map((value) => value ?? '').join('|');

export async function mergeDuplicatePlayers(input: {
  matchKey: string;
  primaryPlayerId: string;
  secondaryPlayerId: string;
  reviewedById: string;
}) {
  return prisma.$transaction(async (tx) => {
    const [primary, secondary] = await Promise.all([
      tx.player.findUnique({ where: { id: input.primaryPlayerId } }),
      tx.player.findUnique({ where: { id: input.secondaryPlayerId } }),
    ]);
    if (!primary || !secondary) throw new Error('One or both player records were not found');
    if (primary.id === secondary.id) throw new Error('The primary and secondary players must be different');
    if (primary.archived || secondary.archived || primary.mergedIntoId || secondary.mergedIntoId) {
      throw new DuplicateMergeConflict(['One of these records is already archived or merged. Refresh the review and try again.']);
    }
    if (duplicateKeyFor(primary) !== input.matchKey || duplicateKeyFor(secondary) !== input.matchKey) {
      throw new DuplicateMergeConflict(['The records no longer match the duplicate warning. Refresh the review and try again.']);
    }

    const [primaryMatchPlayers, secondaryMatchPlayers, primarySeasonPlayers, secondarySeasonPlayers, primaryRosterChanges, secondaryRosterChanges, primarySubstitutions, secondarySubstitutions] = await Promise.all([
      tx.matchPlayer.findMany({ where: { playerId: primary.id }, select: { matchId: true, teamId: true } }),
      tx.matchPlayer.findMany({ where: { playerId: secondary.id }, select: { matchId: true, teamId: true } }),
      tx.seasonTeamPlayer.findMany({ where: { playerId: primary.id }, select: { seasonTeamId: true, leagueSeasonId: true, teamId: true } }),
      tx.seasonTeamPlayer.findMany({ where: { playerId: secondary.id }, select: { seasonTeamId: true, leagueSeasonId: true, teamId: true } }),
      tx.seasonRegistrationRosterChange.findMany({ where: { playerId: primary.id }, select: { applicationId: true } }),
      tx.seasonRegistrationRosterChange.findMany({ where: { playerId: secondary.id }, select: { applicationId: true } }),
      tx.substitution.findMany({ where: { playerOutId: primary.id }, select: { matchId: true, clientBatchId: true } }),
      tx.substitution.findMany({ where: { playerOutId: secondary.id }, select: { matchId: true, clientBatchId: true } }),
    ]);

    const matchKeys = new Set(primaryMatchPlayers.map((row) => pairKey(row.matchId, row.teamId)));
    const matchConflicts = secondaryMatchPlayers.filter((row) => matchKeys.has(pairKey(row.matchId, row.teamId))).map((row) => `match player in match ${row.matchId}`);
    const seasonKeys = new Set(primarySeasonPlayers.flatMap((row) => [pairKey(row.seasonTeamId), pairKey(row.leagueSeasonId, row.teamId)]));
    const seasonConflicts = secondarySeasonPlayers.filter((row) => seasonKeys.has(pairKey(row.seasonTeamId)) || seasonKeys.has(pairKey(row.leagueSeasonId, row.teamId))).map((row) => `season roster in team ${row.seasonTeamId}`);
    const applicationKeys = new Set(primaryRosterChanges.map((row) => row.applicationId));
    const rosterConflicts = secondaryRosterChanges.filter((row) => applicationKeys.has(row.applicationId)).map((row) => `registration application ${row.applicationId}`);
    const substitutionKeys = new Set(primarySubstitutions.map((row) => pairKey(row.matchId, row.clientBatchId)));
    const substitutionConflicts = secondarySubstitutions.filter((row) => substitutionKeys.has(pairKey(row.matchId, row.clientBatchId))).map((row) => `substitution batch in match ${row.matchId}`);
    const conflicts = [...new Set([...matchConflicts, ...seasonConflicts, ...rosterConflicts, ...substitutionConflicts])];
    if (conflicts.length) throw new DuplicateMergeConflict(conflicts);

    const now = new Date();
    await tx.player.update({
      where: { id: primary.id },
      data: {
        bio: primary.bio ?? secondary.bio,
        image: primary.image ?? secondary.image,
        position: primary.position ?? secondary.position,
        jerseyNumber: primary.jerseyNumber ?? secondary.jerseyNumber,
        dateOfBirth: primary.dateOfBirth ?? secondary.dateOfBirth,
        nationality: primary.nationality ?? secondary.nationality,
        height: primary.height ?? secondary.height,
        heightCm: primary.heightCm ?? secondary.heightCm,
        weight: primary.weight ?? secondary.weight,
        weightKg: primary.weightKg ?? secondary.weightKg,
        phone: primary.phone ?? secondary.phone,
        email: primary.email ?? secondary.email,
        teamId: primary.teamId ?? secondary.teamId,
      },
    });

    await tx.seasonRegistrationRosterChange.updateMany({ where: { playerId: secondary.id }, data: { playerId: primary.id } });
    await tx.seasonTeamPlayer.updateMany({ where: { playerId: secondary.id }, data: { playerId: primary.id } });
    await tx.seasonPlayerTransfer.updateMany({ where: { playerId: secondary.id }, data: { playerId: primary.id } });
    await tx.seasonRosterHistory.updateMany({ where: { playerId: secondary.id }, data: { playerId: primary.id } });
    await tx.playerAvailability.updateMany({ where: { playerId: secondary.id }, data: { playerId: primary.id } });
    await tx.playerTeamHistory.updateMany({ where: { playerId: secondary.id }, data: { playerId: primary.id } });
    await tx.matchPlayer.updateMany({ where: { playerId: secondary.id }, data: { playerId: primary.id } });
    await tx.matchEvent.updateMany({ where: { playerId: secondary.id }, data: { playerId: primary.id } });
    await tx.matchEvent.updateMany({ where: { assistPlayerId: secondary.id }, data: { assistPlayerId: primary.id } });
    await tx.registrationNotification.updateMany({ where: { playerId: secondary.id }, data: { playerId: primary.id } });
    await tx.substitution.updateMany({ where: { playerInId: secondary.id }, data: { playerInId: primary.id } });
    await tx.substitution.updateMany({ where: { playerOutId: secondary.id }, data: { playerOutId: primary.id } });
    await tx.jumpBall.updateMany({ where: { player1Id: secondary.id }, data: { player1Id: primary.id } });
    await tx.jumpBall.updateMany({ where: { player2Id: secondary.id }, data: { player2Id: primary.id } });
    await tx.playerOfTheWeek.updateMany({ where: { playerId: secondary.id }, data: { playerId: primary.id } });
    await tx.player.update({ where: { id: secondary.id }, data: { archived: true, approved: false, mergedIntoId: primary.id, mergedAt: now, mergedById: input.reviewedById } });
    await tx.playerDuplicateReview.upsert({
      where: { matchKey: input.matchKey },
      create: { matchKey: input.matchKey, resolution: 'MERGED', reviewedById: input.reviewedById, reviewedAt: now },
      update: { resolution: 'MERGED', reviewedById: input.reviewedById, reviewedAt: now },
    });

    return { primaryPlayerId: primary.id, secondaryPlayerId: secondary.id };
  }, { timeout: 30000 });
}
