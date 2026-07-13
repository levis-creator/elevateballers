import type { APIRoute } from 'astro';
import { getSeasonDetail } from '../../../../features/seasons/data/datasources/season-detail';
import { requirePermission } from '../../../../features/rbac/middleware';
import { handleApiError } from '../../../../lib/apiError';

export const prerender = false;

/**
 * GET /api/seasons/[seasonId]/overview — everything the admin season-detail
 * page renders (season, fixtures, standings, teams) in one call.
 *
 * The permission check runs before the lookup on purpose: a 404 must not tell
 * an unauthorised caller whether a season exists.
 */
export const GET: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'seasons:read');

    const detail = await getSeasonDetail(params.seasonId!);

    if (!detail) {
      return new Response(JSON.stringify({ error: 'Season not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(detail), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'fetch season overview', request);
  }
};
