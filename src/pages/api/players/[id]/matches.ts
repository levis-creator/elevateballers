import type { APIRoute } from 'astro';
import { getPlayerMatches } from '../../../../features/player/lib/queries';
import { handleApiError } from '../../../../lib/apiError';

export const prerender = false;

/**
 * GET /api/players/[id]/matches
 * Get matches where a player participated
 * Query parameters:
 * - limit: Limit number of results
 */
export const GET: APIRoute = async ({ params, request }) => {
  try {
    const playerId = params.id;
    if (!playerId) {
      return new Response(JSON.stringify({ error: 'Player ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    const matches = await getPlayerMatches(playerId, limit);

    return new Response(JSON.stringify(matches), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'fetch player matches', request);
  }
};
