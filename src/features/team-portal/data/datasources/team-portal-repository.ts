import { COACH_ROLE_NAME } from '@/features/users/domain/entities/user-directory';
import { prisma } from '@/lib/prisma';

export async function getTeamPortalUserContext(userId: string) {
  const now = new Date();
  const expiredAssignments = await prisma.teamOwnership.findMany({
    where: { userId, role: COACH_ROLE_NAME, revokedAt: null, effectiveTo: { lte: now } },
    select: { id: true },
  });
  if (expiredAssignments.length) {
    await prisma.$transaction(async (tx) => {
      await tx.teamOwnership.updateMany({ where: { id: { in: expiredAssignments.map(({ id }) => id) }, revokedAt: null }, data: { revokedAt: now } });
      await tx.user.update({ where: { id: userId }, data: { tokenVersion: { increment: 1 } } });
      await tx.userSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: now, revokeReason: 'scheduled_team_transfer' } });
    });
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      active: true,
      activatedAt: true,
      userRoles: { select: { role: { select: { name: true } } } },
      teamOwnerships: {
        where: {
          role: COACH_ROLE_NAME,
          revokedAt: null,
          effectiveFrom: { lte: now },
          OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
        },
        select: { team: { select: { id: true, name: true } } },
        orderBy: { team: { name: 'asc' } },
      },
    },
  });
  if (!user) return null;
  return {
    active: user.active,
    activatedAt: user.activatedAt,
    roles: user.userRoles.map(({ role }) => role.name),
    teams: user.teamOwnerships.map(({ team }) => team),
  };
}
