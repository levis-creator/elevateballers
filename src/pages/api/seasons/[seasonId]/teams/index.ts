import type { APIRoute } from 'astro';
import { getLeagueSeasonTeams, getSeasonTeams } from '../../../../../features/cms/lib/queries';
import { addSeasonTeams } from '../../../../../features/cms/lib/mutations';
import { requirePermission } from '../../../../../features/rbac/middleware';
import { logAudit } from '../../../../../features/cms/lib/audit';
import { handleApiError } from '../../../../../lib/apiError';

export const prerender = false;

/** GET /api/seasons/[seasonId]/teams — teams participating in the season. */
export const GET: APIRoute = async ({ params, request }) => {
  try {
    const leagueSeasonId = new URL(request.url).searchParams.get('leagueSeasonId');
    const teams = leagueSeasonId
      ? await getLeagueSeasonTeams(leagueSeasonId, params.seasonId!)
      : await getSeasonTeams(params.seasonId!);
    return new Response(JSON.stringify(teams), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'fetch season teams');
  }
};

/** POST /api/seasons/[seasonId]/teams — add teams to one league competition. */
export const POST: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'seasons:update');
    const data = await request.json();
    const teamIds: unknown = data?.teamIds;
    const leagueSeasonId: unknown = data?.leagueSeasonId;

    if (typeof leagueSeasonId !== 'string' || !leagueSeasonId) {
      return new Response(
        JSON.stringify({ error: 'leagueSeasonId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!Array.isArray(teamIds) || teamIds.some((id) => typeof id !== 'string')) {
      return new Response(
        JSON.stringify({ error: 'teamIds must be an array of team IDs' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const added = await addSeasonTeams(
      leagueSeasonId,
      teamIds as string[],
      params.seasonId!,
    );
    await logAudit(request, 'SEASON_TEAMS_ADDED', {
      seasonId: params.seasonId,
      leagueSeasonId,
      requested: teamIds.length,
      added,
    });

    return new Response(JSON.stringify({ added }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'add season teams', request);
  }
};
