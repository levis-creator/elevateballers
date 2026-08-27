import type { APIRoute } from 'astro';
import { getCurrentUser } from '@/features/cms/lib/auth';
import { requireActiveTeamContext } from '@/features/team-portal/application/team-portal-access';
import { calculatePlayerStatistics } from '@/features/player/lib/playerStats';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/apiError';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const user = await getCurrentUser(request);
    if (!user) return new Response(JSON.stringify({ error: 'Sign-in required.' }), { status: 401 });
    const params = new URL(request.url).searchParams;
    const playerId = params.get('playerId');
    if (!playerId)
      return new Response(JSON.stringify({ error: 'Player is required.' }), { status: 400 });
    const team = (await requireActiveTeamContext(user.id, params.get('teamId'))).team;
    const season = await prisma.season.findFirst({
      where: { active: true },
      orderBy: { startDate: 'desc' },
      select: { id: true, name: true },
    });
    const seasonTeam = season
      ? await prisma.seasonTeam.findFirst({
          where: { teamId: team.id, seasonId: season.id },
          select: { id: true, leagueSeasonId: true },
        })
      : null;
    const roster = seasonTeam
      ? await prisma.seasonTeamPlayer.findFirst({
          where: {
            playerId,
            seasonTeamId: seasonTeam.id,
            status: { in: ['APPROVED', 'PENDING'] },
            leftAt: null,
          },
          select: {
            status: true,
            jerseyNumber: true,
            position: true,
            player: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                image: true,
                email: true,
                phone: true,
                dateOfBirth: true,
                height: true,
                weight: true,
                nationality: true,
              },
            },
          },
        })
      : null;
    if (!roster)
      return new Response(JSON.stringify({ error: 'Player is not on your active team roster.' }), {
        status: 404,
      });
    const matches = await prisma.match.findMany({
      where: { leagueSeasonId: seasonTeam!.leagueSeasonId, status: 'COMPLETED' },
      select: {
        id: true,
        status: true,
        events: {
          where: { isUndone: false },
          select: { eventType: true, playerId: true, assistPlayerId: true, isUndone: true },
        },
      },
    });
    const stats = calculatePlayerStatistics(matches as any, playerId);
    return new Response(
      JSON.stringify({
        season,
        status: roster.status,
        jerseyNumber: roster.jerseyNumber,
        position: roster.position,
        player: roster.player,
        stats: {
          gp: stats.totalMatches,
          ppg: stats.pointsPerGame,
          reb: stats.reboundsPerGame,
          ast: stats.assistsPerGame,
          stl: stats.stealsPerGame,
          blk: stats.blocksPerGame,
        },
      }),
      { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    return handleApiError(error, 'load Team Portal player', request);
  }
};
