import type { APIRoute } from 'astro';
import { getLeagueDetail } from '../../../../features/leagues/data/datasources/league-detail';
import { requirePermission } from '../../../../features/rbac/middleware';
import { handleApiError } from '../../../../lib/apiError';

export const prerender = false;

/**
 * GET /api/leagues/[leagueId]/overview — everything the admin league-detail
 * page renders (league, seasons, teams, standings, recent matches) in one call.
 */
export const GET: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'leagues:read');

    const detail = await getLeagueDetail(params.leagueId!);

    if (!detail) {
      return new Response(JSON.stringify({ error: 'League not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(detail), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'fetch league overview', request);
  }
};
