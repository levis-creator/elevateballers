import type { APIRoute } from 'astro';
import { removeSeasonTeam } from '../../../../../features/cms/lib/mutations';
import { requirePermission } from '../../../../../features/rbac/middleware';
import { logAudit } from '../../../../../features/cms/lib/audit';
import { handleApiError } from '../../../../../lib/apiError';

export const prerender = false;

/**
 * DELETE /api/seasons/[seasonId]/teams/[teamId] — remove a team from the
 * season roster. Does not delete the team or any of its matches.
 */
export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'seasons:update');
    const removed = await removeSeasonTeam(params.seasonId!, params.teamId!);
    if (!removed) {
      return new Response(
        JSON.stringify({ error: 'Team is not a participant of this season' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    await logAudit(request, 'SEASON_TEAM_REMOVED', {
      seasonId: params.seasonId,
      teamId: params.teamId,
    });
    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error, 'remove season team', request);
  }
};
