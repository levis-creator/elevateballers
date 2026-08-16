import type { APIRoute } from 'astro';
import { requirePermission } from '../../../../features/rbac/middleware';
import { prisma } from '../../../../lib/prisma';
import { handleApiError } from '../../../../lib/apiError';
import { COACH_ROLE_NAME, MAX_COACH_TEAMS, SetCoachTeamsSchema } from '../../../../features/users/domain/entities/user-directory';
import { parseBody } from '../../../../lib/validateBody';

export const prerender = false;

/**
 * PUT /api/users/[id]/teams
 * Replace a Team Coach's club scope (reuses TeamOwnership, role='Team Coach').
 * Requires the user to already hold the Team Coach role — scope has no meaning otherwise.
 */
export const PUT: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'users:manage_roles');

    const { id: userId } = params;
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { teamIds } = await parseBody(request, SetCoachTeamsSchema);

    if (teamIds.length > MAX_COACH_TEAMS) {
      return new Response(JSON.stringify({ error: `A ${COACH_ROLE_NAME} can hold at most ${MAX_COACH_TEAMS} clubs` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, userRoles: { select: { role: { select: { name: true } } } } },
    });
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (!user.userRoles.some((ur) => ur.role.name === COACH_ROLE_NAME)) {
      return new Response(JSON.stringify({ error: `Only users with the ${COACH_ROLE_NAME} role can be scoped to clubs` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (teamIds.length > 0) {
      const teams = await prisma.team.findMany({ where: { id: { in: teamIds } }, select: { id: true } });
      if (teams.length !== teamIds.length) {
        return new Response(JSON.stringify({ error: 'One or more club IDs are invalid' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    await prisma.$transaction([
      prisma.teamOwnership.updateMany({
        where: { userId, role: COACH_ROLE_NAME, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      ...(teamIds.length > 0
        ? [
            prisma.teamOwnership.createMany({
              data: teamIds.map((teamId) => ({ teamId, userId, email: user.email, role: COACH_ROLE_NAME, verifiedAt: new Date() })),
            }),
          ]
        : []),
    ]);

    const rows = await prisma.teamOwnership.findMany({
      where: { userId, role: COACH_ROLE_NAME, revokedAt: null },
      select: { team: { select: { id: true, name: true } } },
    });

    return new Response(JSON.stringify({ coachTeams: rows.map((r) => ({ teamId: r.team.id, teamName: r.team.name })) }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'set coach team scope', request);
  }
};
