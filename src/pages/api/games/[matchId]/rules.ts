import type { APIRoute } from 'astro';
import { getMatchWithGameState } from '../../../../features/game-tracking/lib/queries';

import { handleApiError } from '../../../../lib/apiError';
export const prerender = false;

/**
 * GET /api/games/[matchId]/rules
 * Get game rules for a match
 */
export const GET: APIRoute = async ({ params }) => {
  try {
    const matchId = params.matchId;
    if (!matchId) {
      return new Response(JSON.stringify({ error: 'Match ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const match = await getMatchWithGameState(matchId);

    if (!match) {
      return new Response(JSON.stringify({ error: 'Match not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(match.gameRules), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error fetching game rules:', error);
    return handleApiError(error, "fetch game rules");
  }
};
