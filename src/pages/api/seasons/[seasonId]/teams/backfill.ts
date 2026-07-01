import type { APIRoute } from 'astro';
import { backfillSeasonTeamsFromMatches } from '../../../../../features/cms/lib/mutations';
import { requirePermission } from '../../../../../features/rbac/middleware';
import { logAudit } from '../../../../../features/cms/lib/audit';
import { handleApiError } from '../../../../../lib/apiError';

export const prerender = false;

/**
 * POST /api/seasons/[seasonId]/teams/backfill — seed the season roster from the
 * teams already appearing in its matches. Idempotent; returns { added }.
 */
export const POST: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'seasons:update');
    const added = await backfillSeasonTeamsFromMatches(params.seasonId!);
    await logAudit(request, 'SEASON_TEAMS_BACKFILLED', {
      seasonId: params.seasonId,
      added,
    });
    return new Response(JSON.stringify({ added }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'backfill season teams', request);
  }
};
