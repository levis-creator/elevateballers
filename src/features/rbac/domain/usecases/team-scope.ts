import type { User } from '../../../cms/types';
import { prisma } from '../../../../lib/prisma';
import { requirePermission } from './middleware';
import { hasRole } from '../../data/datasources/permissions';
import { ADMIN_ROLE_NAME, COACH_ROLE_NAME } from '../../../users/domain/entities/user-directory';

/**
 * Team Coach access is limited to active TeamOwnership rows. Other roles keep
 * their existing permission-based behavior; Admin is the explicit global
 * exception for administration workflows.
 */
export async function assertTeamScope(userId: string, teamIds: Array<string | null | undefined>): Promise<void> {
  const normalizedTeamIds = [...new Set(teamIds.filter((id): id is string => Boolean(id)))];
  if (normalizedTeamIds.length === 0) throw new Error('Forbidden: This resource is not assigned to a team');
  if (await hasRole(userId, ADMIN_ROLE_NAME)) return;
  if (!(await hasRole(userId, COACH_ROLE_NAME))) return;

  const ownership = await prisma.teamOwnership.findFirst({
    where: { userId, role: COACH_ROLE_NAME, revokedAt: null, teamId: { in: normalizedTeamIds } },
    select: { id: true },
  });
  if (!ownership) throw new Error('Forbidden: Team Coach is not assigned to this team');
}

export async function requireTeamScopedPermission(request: Request, teamId: string, permission: string): Promise<User> {
  const user = await requirePermission(request, permission);
  await assertTeamScope(user.id, [teamId]);
  return user;
}

export async function requirePlayerScopedPermission(request: Request, playerId: string, permission: string): Promise<User> {
  const user = await requirePermission(request, permission);
  const player = await prisma.player.findUnique({ where: { id: playerId }, select: { teamId: true } });
  if (!player) throw new Error('Player not found');
  await assertTeamScope(user.id, [player.teamId]);
  return user;
}

export async function requireMatchScopedPermission(request: Request, matchId: string, permission: string): Promise<User> {
  const user = await requirePermission(request, permission);
  const match = await prisma.match.findUnique({ where: { id: matchId }, select: { team1Id: true, team2Id: true } });
  if (!match) throw new Error('Match not found');
  await assertTeamScope(user.id, [match.team1Id, match.team2Id]);
  return user;
}

export async function requireSeasonTeamScopedPermission(request: Request, seasonTeamId: string, permission: string): Promise<User> {
  const user = await requirePermission(request, permission);
  const seasonTeam = await prisma.seasonTeam.findUnique({ where: { id: seasonTeamId }, select: { teamId: true } });
  if (!seasonTeam) throw new Error('Season team not found');
  await assertTeamScope(user.id, [seasonTeam.teamId]);
  return user;
}

export async function requireRosterScopedPermission(request: Request, rosterId: string, permission: string): Promise<User> {
  const user = await requirePermission(request, permission);
  const roster = await prisma.seasonTeamPlayer.findUnique({ where: { id: rosterId }, select: { teamId: true } });
  if (!roster) throw new Error('Roster entry not found');
  await assertTeamScope(user.id, [roster.teamId]);
  return user;
}

export async function requireTransferScopedPermission(request: Request, transferId: string, permission: string): Promise<User> {
  const user = await requirePermission(request, permission);
  const transfer = await prisma.seasonPlayerTransfer.findUnique({
    where: { id: transferId },
    select: { fromSeasonTeam: { select: { teamId: true } }, toSeasonTeam: { select: { teamId: true } } },
  });
  if (!transfer) throw new Error('Transfer not found');
  await assertTeamScope(user.id, [transfer.fromSeasonTeam.teamId, transfer.toSeasonTeam.teamId]);
  return user;
}

export async function requireLegacyTeamStaffScopedPermission(request: Request, teamId: string, permission: string, staffAssignmentId?: string): Promise<User> {
  const user = await requirePermission(request, permission);
  if (staffAssignmentId) {
    const assignment = await prisma.teamStaff.findUnique({ where: { id: staffAssignmentId }, select: { teamId: true } });
    if (!assignment || assignment.teamId !== teamId) throw new Error('Forbidden: Staff assignment is not part of this team');
  }
  await assertTeamScope(user.id, [teamId]);
  return user;
}

export async function requireCoachingStaffScopedPermission(request: Request, teamId: string, permission: string, staffMemberId?: string): Promise<User> {
  const user = await requirePermission(request, permission);
  if (staffMemberId) {
    const member = await prisma.teamStaffMember.findUnique({ where: { id: staffMemberId }, select: { teamId: true } });
    if (!member || member.teamId !== teamId) throw new Error('Forbidden: Staff member is not part of this team');
  }
  await assertTeamScope(user.id, [teamId]);
  return user;
}
