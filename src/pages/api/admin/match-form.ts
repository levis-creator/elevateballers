import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';
import { getCurrentUser } from '../../../features/cms/lib/auth';
import { getUserWithPermissions } from '../../../features/rbac/permissions';
import { handleApiError } from '../../../lib/apiError';

export const prerender = false;

export const GET: APIRoute = async ({ request, url }) => {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) return Response.json({ error: 'Not authenticated' }, { status: 401 });
    const user = await getUserWithPermissions(currentUser.id);
    const permissions = new Set(user?.permissions || []);
    if (!permissions.has('matches:create') && !permissions.has('matches:update')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const matchId = url.searchParams.get('matchId');
    const teams = await prisma.team.findMany({
      where: { approved: true, archived: false },
      select: { id: true, name: true, logo: true },
      orderBy: { name: 'asc' },
    });
    const leagues = await prisma.league.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    const match = matchId
      ? await prisma.match.findUnique({
          where: { id: matchId },
          select: {
            id: true, team1Id: true, team1Name: true, team2Id: true, team2Name: true,
            leagueId: true, seasonId: true, leagueSeasonId: true, date: true,
            team1Score: true, team2Score: true, status: true, stage: true, duration: true,
          },
        })
      : null;

    return Response.json({ teams, leagues, match });
  } catch (error) {
    return handleApiError(error, 'fetch match form bootstrap', request);
  }
};
