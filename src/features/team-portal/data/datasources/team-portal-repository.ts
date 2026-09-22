import { COACH_ROLE_NAME } from '@/features/users/domain/entities/user-directory';
import { prisma } from '@/lib/prisma';

/**
 * Resolves the active season and this team's participation in it. `seasonTeam`
 * is null when the team is not registered for the active season.
 */
export async function getActiveSeasonTeam(teamId: string) {
  const season = await prisma.season.findFirst({
    where: { active: true },
    orderBy: { startDate: 'desc' },
    select: { id: true, name: true },
  });
  if (!season) return { season: null, seasonTeam: null };
  const row = await prisma.seasonTeam.findFirst({
    where: { teamId, seasonId: season.id },
    select: {
      id: true,
      leagueSeasonId: true,
      leagueSeason: { select: { league: { select: { name: true } } } },
    },
  });
  const seasonTeam = row
    ? { id: row.id, leagueSeasonId: row.leagueSeasonId, leagueName: row.leagueSeason.league.name }
    : null;
  return { season, seasonTeam };
}

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
