import { createHash, randomBytes } from 'node:crypto';
import { prisma } from '../../../../lib/prisma';
import type { CreateSeasonRegistrationCommand } from '../../domain/entities/season-registration';
import type { SeasonRegistrationRepository } from '../../domain/usecases/season-registration';

const CLAIM_TTL_HOURS = 48;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function claimExpiry(): Date {
  const value = new Date();
  value.setHours(value.getHours() + CLAIM_TTL_HOURS);
  return value;
}

/** Prisma adapter for season registration. All writes are scoped to a LeagueSeason. */
export function createPrismaSeasonRegistrationRepository(): SeasonRegistrationRepository {
  return {
    async listRoster(seasonTeamId, includePending = false) {
      return (prisma as any).seasonTeamPlayer.findMany({ where: { seasonTeamId, ...(includePending ? {} : { status: 'APPROVED', leftAt: null }) }, include: { player: true }, orderBy: { createdAt: 'asc' } });
    },

    async create(command) {
      const db = prisma as any;
      if (command.type === 'RETURNING_TEAM' && !command.teamId) throw new Error('A returning team is required');
      if (command.type === 'NEW_TEAM' && (!command.requestedTeamName || command.teamId)) throw new Error('A new team name is required');
      const application = await db.seasonRegistrationApplication.create({
        data: {
          leagueSeasonId: command.leagueSeasonId,
          teamId: command.teamId,
          requestedTeamName: command.requestedTeamName,
          type: command.type,
          applicantName: command.applicantName,
          applicantEmail: command.applicantEmail,
          notes: command.notes,
          rosterChanges: { create: (command.rosterChanges ?? []).map((change) => ({ ...change })) },
        },
        include: { rosterChanges: true },
      });
      return application;
    },

    async requestOwnershipVerification(applicationId) {
      const token = randomBytes(32).toString('hex');
      const expiresAt = claimExpiry();
      await (prisma as any).$transaction(async (tx: any) => {
        const application = await tx.seasonRegistrationApplication.findUnique({ where: { id: applicationId } });
        if (!application || !application.teamId) throw new Error('A team is required before ownership can be verified');
        await tx.teamOwnershipClaim.upsert({
          where: { applicationId },
          update: { tokenHash: hashToken(token), status: 'PENDING', expiresAt, verifiedAt: null },
          create: { applicationId, teamId: application.teamId, email: application.applicantEmail, tokenHash: hashToken(token), expiresAt },
        });
        await tx.seasonRegistrationApplication.update({ where: { id: applicationId }, data: { status: 'OWNERSHIP_VERIFICATION' } });
      });
      return { token, expiresAt };
    },

    async verifyOwnership(token) {
      return (prisma as any).$transaction(async (tx: any) => {
        const claim = await tx.teamOwnershipClaim.findUnique({ where: { tokenHash: hashToken(token) } });
        if (!claim || claim.status !== 'PENDING' || claim.expiresAt <= new Date()) throw new Error('Ownership verification token is invalid or expired');
        await tx.teamOwnershipClaim.update({ where: { id: claim.id }, data: { status: 'VERIFIED', verifiedAt: new Date() } });
        await tx.teamOwnership.create({ data: { teamId: claim.teamId, email: claim.email, verifiedAt: new Date() } });
        return tx.seasonRegistrationApplication.update({ where: { id: claim.applicationId }, data: { status: 'PENDING' }, include: { rosterChanges: true } });
      });
    },

    async approve(applicationId, reviewerId) {
      return (prisma as any).$transaction(async (tx: any) => {
        const application = await tx.seasonRegistrationApplication.findUnique({ where: { id: applicationId }, include: { rosterChanges: true } });
        if (!application || application.status !== 'PENDING') throw new Error('Only pending applications can be approved');
        if (!application.teamId) throw new Error('New team applications must be linked to a team before approval');
        const edition = await tx.leagueSeason.findUnique({ where: { id: application.leagueSeasonId } });
        if (!edition) throw new Error('Season edition not found');
        const seasonTeam = await tx.seasonTeam.upsert({
          where: { leagueSeasonId_teamId: { leagueSeasonId: edition.id, teamId: application.teamId } },
          update: {},
          create: { leagueSeasonId: edition.id, seasonId: edition.seasonId, leagueId: edition.leagueId, teamId: application.teamId },
        });
        for (const change of application.rosterChanges) {
          if (change.status !== 'PENDING') continue;
          if (change.action === 'ADD') {
            await tx.seasonTeamPlayer.upsert({ where: { seasonTeamId_playerId: { seasonTeamId: seasonTeam.id, playerId: change.playerId } }, update: { leftAt: null, jerseyNumber: change.jerseyNumber, position: change.position }, create: { leagueSeasonId: edition.id, seasonTeamId: seasonTeam.id, teamId: application.teamId, playerId: change.playerId, jerseyNumber: change.jerseyNumber, position: change.position } });
          } else {
            await tx.seasonTeamPlayer.updateMany({ where: { seasonTeamId: seasonTeam.id, playerId: change.playerId, leftAt: null }, data: { leftAt: new Date() } });
          }
          await tx.seasonRegistrationRosterChange.update({ where: { id: change.id }, data: { status: 'APPROVED', processedAt: new Date() } });
        }
        return tx.seasonRegistrationApplication.update({ where: { id: applicationId }, data: { status: 'APPROVED', seasonTeamId: seasonTeam.id, reviewedById: reviewerId, reviewedAt: new Date() }, include: { rosterChanges: true, seasonTeam: true } });
      });
    },

    async reject(applicationId, reviewerId, adminNotes) {
      return (prisma as any).seasonRegistrationApplication.update({ where: { id: applicationId, status: 'PENDING' }, data: { status: 'REJECTED', adminNotes, reviewedById: reviewerId, reviewedAt: new Date() }, include: { rosterChanges: true } });
    },

    async addRosterPlayer(seasonTeamId, playerId, jerseyNumber, position) {
      const seasonTeam = await (prisma as any).seasonTeam.findUnique({ where: { id: seasonTeamId } });
      if (!seasonTeam) throw new Error('Season team not found');
      const roster = await (prisma as any).seasonTeamPlayer.upsert({ where: { seasonTeamId_playerId: { seasonTeamId, playerId } }, update: { status: 'PENDING', leftAt: null, jerseyNumber, position }, create: { leagueSeasonId: seasonTeam.leagueSeasonId, seasonTeamId, teamId: seasonTeam.teamId, playerId, jerseyNumber, position, status: 'PENDING' } });
      await (prisma as any).seasonRosterHistory.create({ data: { leagueSeasonId: seasonTeam.leagueSeasonId, playerId, seasonTeamId, rosterId: roster.id, action: 'ROSTER_ADDED' } });
      return roster;
    },

    async removeRosterPlayer(seasonTeamId, playerId) {
      const roster = await (prisma as any).seasonTeamPlayer.findFirst({ where: { seasonTeamId, playerId, leftAt: null } });
      if (!roster) return { count: 0 };
      const result = await (prisma as any).seasonTeamPlayer.update({ where: { id: roster.id }, data: { status: 'WITHDRAWN', leftAt: new Date() } });
      await (prisma as any).seasonRosterHistory.create({ data: { leagueSeasonId: roster.leagueSeasonId, playerId, seasonTeamId, rosterId: roster.id, action: 'ROSTER_WITHDRAWN' } });
      return result;
    },

    async approveRosterPlayer(rosterId, reviewerId) {
      return (prisma as any).$transaction(async (tx: any) => {
        const current = await tx.seasonTeamPlayer.findUnique({ where: { id: rosterId } });
        if (!current || current.status !== 'PENDING') throw new Error('Only pending roster memberships can be approved');
        const roster = await tx.seasonTeamPlayer.update({ where: { id: rosterId }, data: { status: 'APPROVED' } });
        await tx.seasonRosterHistory.create({ data: { leagueSeasonId: roster.leagueSeasonId, playerId: roster.playerId, seasonTeamId: roster.seasonTeamId, rosterId, action: 'ROSTER_APPROVED', changedById: reviewerId } });
        return roster;
      });
    },

    async rejectRosterPlayer(rosterId, reviewerId) {
      return (prisma as any).$transaction(async (tx: any) => {
        const current = await tx.seasonTeamPlayer.findUnique({ where: { id: rosterId } });
        if (!current || current.status !== 'PENDING') throw new Error('Only pending roster memberships can be rejected');
        const roster = await tx.seasonTeamPlayer.update({ where: { id: rosterId }, data: { status: 'REJECTED', leftAt: new Date() } });
        await tx.seasonRosterHistory.create({ data: { leagueSeasonId: roster.leagueSeasonId, playerId: roster.playerId, seasonTeamId: roster.seasonTeamId, rosterId, action: 'ROSTER_REJECTED', changedById: reviewerId } });
        return roster;
      });
    },

    async withdrawRosterPlayer(rosterId, changedById) {
      return (prisma as any).$transaction(async (tx: any) => {
        const current = await tx.seasonTeamPlayer.findUnique({ where: { id: rosterId } });
        if (!current || current.status !== 'APPROVED' || current.leftAt) throw new Error('Only active approved roster memberships can be withdrawn');
        const roster = await tx.seasonTeamPlayer.update({ where: { id: rosterId }, data: { status: 'WITHDRAWN', leftAt: new Date() } });
        await tx.seasonRosterHistory.create({ data: { leagueSeasonId: roster.leagueSeasonId, playerId: roster.playerId, seasonTeamId: roster.seasonTeamId, rosterId, action: 'ROSTER_WITHDRAWN', changedById } });
        return roster;
      });
    },

    async requestTransfer(input) {
      const [fromTeam, toTeam] = await Promise.all([
        (prisma as any).seasonTeam.findUnique({ where: { id: input.fromSeasonTeamId } }),
        (prisma as any).seasonTeam.findUnique({ where: { id: input.toSeasonTeamId } }),
      ]);
      if (!fromTeam || !toTeam || fromTeam.leagueSeasonId !== toTeam.leagueSeasonId) throw new Error('Transfer teams must belong to the same league season');
      const current = await (prisma as any).seasonTeamPlayer.findFirst({ where: { seasonTeamId: input.fromSeasonTeamId, playerId: input.playerId, status: 'APPROVED', leftAt: null } });
      if (!current) throw new Error('Player is not active on the source roster');
      return (prisma as any).seasonPlayerTransfer.create({ data: { leagueSeasonId: fromTeam.leagueSeasonId, playerId: input.playerId, fromSeasonTeamId: input.fromSeasonTeamId, toSeasonTeamId: input.toSeasonTeamId, fromRosterId: current.id, reason: input.reason, requestedById: input.requestedById } });
    },

    async approveTransfer(transferId, reviewerId) {
      return (prisma as any).$transaction(async (tx: any) => {
        const transfer = await tx.seasonPlayerTransfer.findUnique({ where: { id: transferId } });
        if (!transfer || transfer.status !== 'PENDING') throw new Error('Only pending transfers can be approved');
        const source = await tx.seasonTeamPlayer.findUnique({ where: { id: transfer.fromRosterId } });
        if (!source || source.status !== 'APPROVED' || source.leftAt) throw new Error('Source roster membership is no longer active');
        await tx.seasonTeamPlayer.update({ where: { id: source.id }, data: { status: 'WITHDRAWN', leftAt: new Date() } });
        const target = await tx.seasonTeamPlayer.upsert({ where: { seasonTeamId_playerId: { seasonTeamId: transfer.toSeasonTeamId, playerId: transfer.playerId } }, update: { status: 'APPROVED', leftAt: null }, create: { leagueSeasonId: transfer.leagueSeasonId, seasonTeamId: transfer.toSeasonTeamId, teamId: (await tx.seasonTeam.findUnique({ where: { id: transfer.toSeasonTeamId }, select: { teamId: true } })).teamId, playerId: transfer.playerId, status: 'APPROVED' } });
        await tx.seasonRosterHistory.createMany({ data: [{ leagueSeasonId: transfer.leagueSeasonId, playerId: transfer.playerId, seasonTeamId: transfer.fromSeasonTeamId, rosterId: source.id, action: 'TRANSFER_OUT', fromTeamId: transfer.fromSeasonTeamId, toTeamId: transfer.toSeasonTeamId, changedById: reviewerId }, { leagueSeasonId: transfer.leagueSeasonId, playerId: transfer.playerId, seasonTeamId: transfer.toSeasonTeamId, rosterId: target.id, action: 'TRANSFER_IN', fromTeamId: transfer.fromSeasonTeamId, toTeamId: transfer.toSeasonTeamId, changedById: reviewerId }] });
        return tx.seasonPlayerTransfer.update({ where: { id: transferId }, data: { status: 'APPROVED', toRosterId: target.id, reviewedById: reviewerId, reviewedAt: new Date() } });
      });
    },
  };
}
