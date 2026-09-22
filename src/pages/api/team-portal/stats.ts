import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/features/cms/lib/auth';
import { requireActiveTeamContext } from '@/features/team-portal/application/team-portal-access';
import { getActiveSeasonTeam } from '@/features/team-portal/data/datasources/team-portal-repository';
import { getTeamSeasonSummary } from '@/features/team-portal/data/datasources/team-season-summary';
import { calculatePlayerStatistics } from '@/features/player/lib/playerStats';
import { handleApiError } from '@/lib/apiError';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const user = await getCurrentUser(request);
    if (!user) return new Response(JSON.stringify({ error: 'Sign-in required.' }), { status: 401 });
    const team = (
      await requireActiveTeamContext(user.id, new URL(request.url).searchParams.get('teamId'))
    ).team;
    const { season, seasonTeam } = await getActiveSeasonTeam(team.id);

    const [summary, rosterRows] = await Promise.all([
      getTeamSeasonSummary(team.id, seasonTeam?.leagueSeasonId ?? null),
      seasonTeam
        ? prisma.seasonTeamPlayer.findMany({
            where: { seasonTeamId: seasonTeam.id, status: 'APPROVED', leftAt: null },
            select: {
              jerseyNumber: true,
              position: true,
              player: {
                select: { id: true, firstName: true, lastName: true, position: true, jerseyNumber: true },
              },
            },
          })
        : prisma.player
            .findMany({
              where: { teamId: team.id },
              select: { id: true, firstName: true, lastName: true, position: true, jerseyNumber: true },
            })
            .then((players) =>
              players.map((player) => ({ jerseyNumber: null, position: null, player }))
            ),
    ]);

    const { completed, record, tablePosition, tableSize, form } = summary;

    const events = completed.length
      ? await prisma.match.findMany({
          where: { id: { in: completed.map((m) => m.id) } },
          select: {
            id: true,
            status: true,
            events: {
              where: { isUndone: false },
              select: { eventType: true, playerId: true, assistPlayerId: true, isUndone: true },
            },
          },
        })
      : [];
    const players = rosterRows
      .map(({ jerseyNumber, position, player }) => {
        const stats = calculatePlayerStatistics(events as any, player.id);
        return {
          id: player.id,
          name: `${player.firstName ?? ''} ${player.lastName ?? ''}`.trim() || 'Unnamed player',
          jerseyNumber: jerseyNumber ?? player.jerseyNumber,
          position: position || player.position,
          gp: stats.totalMatches,
          ppg: stats.pointsPerGame,
          rpg: stats.reboundsPerGame,
          apg: stats.assistsPerGame,
          spg: stats.stealsPerGame,
          bpg: stats.blocksPerGame,
          fgPct: stats.fieldGoalPercentage,
          ftPct: stats.freeThrowPercentage,
          threePct: stats.threePointPercentage,
        };
      })
      .sort((a, b) => b.ppg - a.ppg || a.name.localeCompare(b.name));

    return new Response(
      JSON.stringify({
        season,
        leagueName: seasonTeam?.leagueName ?? null,
        registered: Boolean(seasonTeam),
        record,
        tablePosition,
        tableSize,
        form,
        players,
      }),
      { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    return handleApiError(error, 'load Team Portal stats', request);
  }
};
