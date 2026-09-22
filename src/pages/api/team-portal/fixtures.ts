import type { APIRoute } from 'astro';
import { getCurrentUser } from '@/features/cms/lib/auth';
import { requireActiveTeamContext } from '@/features/team-portal/application/team-portal-access';
import { getActiveSeasonTeam } from '@/features/team-portal/data/datasources/team-portal-repository';
import { getLineupCounts, toTeamFixture } from '@/features/team-portal/data/datasources/team-fixtures';
import { getFilteredMatches } from '@/features/matches/lib/queries';
import { handleApiError } from '@/lib/apiError';

export const prerender = false;

const UPCOMING_LIMIT = 20;
const RESULTS_LIMIT = 30;

export const GET: APIRoute = async ({ request }) => {
  try {
    const user = await getCurrentUser(request);
    if (!user) return new Response(JSON.stringify({ error: 'Sign-in required.' }), { status: 401 });
    const team = (
      await requireActiveTeamContext(user.id, new URL(request.url).searchParams.get('teamId'))
    ).team;
    const { season, seasonTeam } = await getActiveSeasonTeam(team.id);
    // Scope to the active season when the team is registered for it; otherwise
    // fall back to every match the team has played so results never vanish.
    const filter = {
      teamId: team.id,
      ...(seasonTeam ? { leagueSeasonId: seasonTeam.leagueSeasonId } : {}),
    };
    const [live, upcoming, results] = await Promise.all([
      getFilteredMatches({ ...filter, status: 'LIVE' }, 'date-asc'),
      getFilteredMatches({ ...filter, status: 'UPCOMING' }, 'date-asc', UPCOMING_LIMIT),
      getFilteredMatches({ ...filter, status: 'COMPLETED' }, 'date-desc', RESULTS_LIMIT),
    ]);
    const lineups = await getLineupCounts(
      [...live, ...upcoming].map((m) => m.id),
      team.id
    );
    const toFixture = (m: any) => toTeamFixture(m, team.id, lineups);

    return new Response(
      JSON.stringify({
        season,
        leagueName: seasonTeam?.leagueName ?? null,
        registered: Boolean(seasonTeam),
        live: live.map(toFixture),
        upcoming: upcoming.map(toFixture),
        results: results.map(toFixture),
      }),
      { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    return handleApiError(error, 'load Team Portal fixtures', request);
  }
};
