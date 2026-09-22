import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/features/cms/lib/auth';
import { requireActiveTeamContext } from '@/features/team-portal/application/team-portal-access';
import { getActiveSeasonTeam } from '@/features/team-portal/data/datasources/team-portal-repository';
import { toTeamFixture } from '@/features/team-portal/data/datasources/team-fixtures';
import { isLineupLocked } from '@/features/team-portal/domain/entities/lineup';
import { calculatePlayerMatchStats } from '@/features/player/lib/playerStats';
import { handleApiError } from '@/lib/apiError';

export const prerender = false;

const periodLabel = (n: number) => (n <= 4 ? `Q${n}` : `OT${n - 4}`);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export const GET: APIRoute = async ({ request }) => {
  try {
    const user = await getCurrentUser(request);
    if (!user) return json({ error: 'Sign-in required.' }, 401);
    const params = new URL(request.url).searchParams;
    const team = (await requireActiveTeamContext(user.id, params.get('teamId'))).team;
    const matchId = params.get('matchId');
    if (!matchId) return json({ error: 'Match is required.' }, 400);

    const match = await prisma.match.findFirst({
      where: { id: matchId, OR: [{ team1Id: team.id }, { team2Id: team.id }] },
      select: {
        id: true,
        slug: true,
        date: true,
        status: true,
        stage: true,
        resultPublishedAt: true,
        leagueSeasonId: true,
        leagueName: true,
        team1Id: true,
        team2Id: true,
        team1Name: true,
        team2Name: true,
        team1Logo: true,
        team2Logo: true,
        team1Score: true,
        team2Score: true,
        team1: { select: { id: true, name: true, nickname: true, logo: true } },
        team2: { select: { id: true, name: true, nickname: true, logo: true } },
        league: { select: { name: true } },
        events: {
          where: { isUndone: false },
          select: { eventType: true, playerId: true, assistPlayerId: true, isUndone: true },
        },
        matchPlayers: {
          where: { teamId: team.id },
          select: {
            playerId: true,
            started: true,
            jerseyNumber: true,
            minutesPlayed: true,
            player: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
    if (!match) return json({ error: 'Match not found for your team.' }, 404);

    // Finals stay private until the league office publishes them, matching the
    // Fixtures list and the public site.
    const resultPending = match.status === 'COMPLETED' && !match.resultPublishedAt;
    const showStats = match.status === 'LIVE' || (match.status === 'COMPLETED' && !resultPending);
    const isHome = match.team1Id === team.id;

    const listed = match.matchPlayers.length;
    const starters = match.matchPlayers.filter((row) => row.started).length;
    const fixture = toTeamFixture(
      resultPending ? { ...match, team1Score: null, team2Score: null } : match,
      team.id,
      new Map([[match.id, { players: listed, starters }]])
    );

    const [periods, { seasonTeam }] = await Promise.all([
      showStats
        ? prisma.matchPeriod.findMany({
            where: { matchId: match.id },
            orderBy: { periodNumber: 'asc' },
            select: { periodNumber: true, team1Score: true, team2Score: true },
          })
        : Promise.resolve([]),
      getActiveSeasonTeam(team.id),
    ]);

    const players = match.matchPlayers
      .map((row) => {
        const stats = calculatePlayerMatchStats(row.playerId, match.events);
        return {
          playerId: row.playerId,
          name: `${row.player.firstName ?? ''} ${row.player.lastName ?? ''}`.trim() || 'Unnamed player',
          jerseyNumber: row.jerseyNumber,
          started: row.started,
          minutes: row.minutesPlayed,
          ...(showStats
            ? {
                pts: stats.points,
                reb: stats.rebounds,
                ast: stats.assists,
                stl: stats.steals,
                blk: stats.blocks,
                pf: stats.fouls,
                fg: `${stats.fieldGoalsMade}/${stats.fieldGoalsAttempted}`,
                tp: `${stats.threePointersMade}/${stats.threePointersAttempted}`,
                ft: `${stats.freeThrowsMade}/${stats.freeThrowsAttempted}`,
              }
            : {}),
        };
      })
      .sort(
        (a, b) =>
          Number(b.started) - Number(a.started) ||
          (b.pts ?? 0) - (a.pts ?? 0) ||
          (a.jerseyNumber ?? 999) - (b.jerseyNumber ?? 999)
      );

    const sum = (key: 'pts' | 'reb' | 'ast' | 'stl' | 'blk' | 'pf') =>
      players.reduce((total, row) => total + (row[key] ?? 0), 0);

    return json({
      match: fixture,
      resultPending,
      showStats,
      // Only the active season's upcoming matches accept lineup changes.
      lineupEditable:
        !isLineupLocked(match) && Boolean(seasonTeam) && match.leagueSeasonId === seasonTeam?.leagueSeasonId,
      quarters: periods.map((period) => ({
        label: periodLabel(period.periodNumber),
        team: isHome ? period.team1Score : period.team2Score,
        opp: isHome ? period.team2Score : period.team1Score,
      })),
      hasPlayByPlay: match.events.length > 0,
      players,
      totals: showStats
        ? { pts: sum('pts'), reb: sum('reb'), ast: sum('ast'), stl: sum('stl'), blk: sum('blk'), pf: sum('pf') }
        : null,
    });
  } catch (error) {
    return handleApiError(error, 'load Team Portal match', request);
  }
};
