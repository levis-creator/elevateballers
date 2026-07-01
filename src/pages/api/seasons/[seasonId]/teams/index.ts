import type { APIRoute } from 'astro';
import { getSeasonTeams } from '../../../../../features/cms/lib/queries';
import { addSeasonTeams } from '../../../../../features/cms/lib/mutations';
import { requirePermission } from '../../../../../features/rbac/middleware';
import { logAudit } from '../../../../../features/cms/lib/audit';
import { handleApiError } from '../../../../../lib/apiError';

export const prerender = false;

/** GET /api/seasons/[seasonId]/teams — teams participating in the season. */
export const GET: APIRoute = async ({ params }) => {
  try {
    const teams = await getSeasonTeams(params.seasonId!);
    return new Response(JSON.stringify(teams), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'fetch season teams');
  }
};

/** POST /api/seasons/[seasonId]/teams — add teams to the season. Body: { teamIds: string[] } */
export const POST: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'seasons:update');
    const data = await request.json();
    const teamIds: unknown = data?.teamIds;

    if (!Array.isArray(teamIds) || teamIds.some((id) => typeof id !== 'string')) {
      return new Response(
        JSON.stringify({ error: 'teamIds must be an array of team IDs' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const added = await addSeasonTeams(params.seasonId!, teamIds as string[]);
    await logAudit(request, 'SEASON_TEAMS_ADDED', {
      seasonId: params.seasonId,
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
