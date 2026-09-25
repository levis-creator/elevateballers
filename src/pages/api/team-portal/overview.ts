import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/features/cms/lib/auth';
import { requireActiveTeamContext } from '@/features/team-portal/application/team-portal-access';
import { getActiveSeasonTeam } from '@/features/team-portal/data/datasources/team-portal-repository';
import { getLineupCounts, toTeamFixture } from '@/features/team-portal/data/datasources/team-fixtures';
import { getTeamSeasonSummary } from '@/features/team-portal/data/datasources/team-season-summary';
import {
  buildNeedsYou,
  ROSTER_DECISION_ACTIONS,
  ROSTER_DECISION_DAYS,
  type RosterDecisionAction,
} from '@/features/team-portal/domain/entities/needs-you';
import { getFilteredMatches } from '@/features/matches/lib/queries';
import { handleApiError } from '@/lib/apiError';

export const prerender = false;

const REMOVAL_ACTIONS = ['ROSTER_REMOVAL_PROPOSED', 'ROSTER_REMOVAL_APPROVED', 'ROSTER_REMOVAL_REJECTED'];

/** Removal requests whose latest decision is still "proposed". */
async function countPendingRemovals(seasonTeamId: string) {
  const history = await prisma.seasonRosterHistory.findMany({
    where: { seasonTeamId, action: { in: REMOVAL_ACTIONS }, roster: { status: 'APPROVED', leftAt: null } },
    orderBy: { createdAt: 'desc' },
    select: { rosterId: true, action: true },
  });
  const latest = new Map<string, string>();
  for (const row of history) if (row.rosterId && !latest.has(row.rosterId)) latest.set(row.rosterId, row.action);
  return [...latest.values()].filter((action) => action === 'ROSTER_REMOVAL_PROPOSED').length;
}

/** League-office decisions on the team's roster that the coach hasn't had time to see yet. */
async function recentRosterDecisions(seasonTeamId: string, now: Date) {
  const rows = await prisma.seasonRosterHistory.findMany({
    where: {
      seasonTeamId,
      action: { in: [...ROSTER_DECISION_ACTIONS] },
      createdAt: { gte: new Date(now.getTime() - ROSTER_DECISION_DAYS * 86_400_000) },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      action: true,
      createdAt: true,
      player: { select: { firstName: true, lastName: true } },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    action: row.action as RosterDecisionAction,
    playerName: `${row.player?.firstName ?? ''} ${row.player?.lastName ?? ''}`.trim() || 'A player',
    at: row.createdAt,
  }));
}

export const GET: APIRoute = async ({ request }) => {
  try {
    const user = await getCurrentUser(request);
    if (!user) return new Response(JSON.stringify({ error: 'Sign-in required.' }), { status: 401 });
    const team = (
      await requireActiveTeamContext(user.id, new URL(request.url).searchParams.get('teamId'))
    ).team;
    const { season, seasonTeam } = await getActiveSeasonTeam(team.id);
    const scope = {
      teamId: team.id,
      ...(seasonTeam ? { leagueSeasonId: seasonTeam.leagueSeasonId } : {}),
    };

    const now = new Date();
    const [live, upcoming, summary, latestApplication, pendingPlayers, pendingRemovals, recentDecisions] =
      await Promise.all([
        getFilteredMatches({ ...scope, status: 'LIVE' }, 'date-asc', 1),
        getFilteredMatches({ ...scope, status: 'UPCOMING' }, 'date-asc', 1),
        getTeamSeasonSummary(team.id, seasonTeam?.leagueSeasonId ?? null),
        season
          ? prisma.seasonRegistrationApplication.findFirst({
              where: { teamId: team.id, leagueSeason: { seasonId: season.id } },
              orderBy: { createdAt: 'desc' },
              select: { status: true, adminNotes: true },
            })
          : Promise.resolve(null),
        seasonTeam
          ? prisma.seasonTeamPlayer.count({
              where: { seasonTeamId: seasonTeam.id, status: 'PENDING', leftAt: null },
            })
          : Promise.resolve(0),
        seasonTeam ? countPendingRemovals(seasonTeam.id) : Promise.resolve(0),
        seasonTeam ? recentRosterDecisions(seasonTeam.id, now) : Promise.resolve([]),
      ]);

    const next = live[0] ?? upcoming[0] ?? null;
    const lineups = await getLineupCounts(next ? [next.id] : [], team.id);
    const nextFixture = next ? toTeamFixture(next, team.id, lineups) : null;

    const needsYou = buildNeedsYou({
      now,
      hasActiveSeason: Boolean(season),
      registered: Boolean(seasonTeam),
      nextMatch: nextFixture
        ? {
            id: nextFixture.id,
            date: new Date(nextFixture.date),
            status: nextFixture.status,
            opponent: nextFixture.opponent.name,
            lineupPlayers: nextFixture.lineup?.players ?? 0,
          }
        : null,
      latestApplication,
      pendingPlayers,
      pendingRemovals,
      recentDecisions,
    });

    return new Response(
      JSON.stringify({
        season,
        leagueName: seasonTeam?.leagueName ?? null,
        registered: Boolean(seasonTeam),
        nextFixture,
        record: summary.record,
        tablePosition: summary.tablePosition,
        tableSize: summary.tableSize,
        form: summary.form,
        needsYou,
      }),
      { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    return handleApiError(error, 'load Team Portal overview', request);
  }
};
