import type { APIRoute } from 'astro';
import { getGameState, getMatchWithGameState } from '../../../../features/game-tracking/lib/queries';
import { updateGameState } from '../../../../features/game-tracking/lib/mutations';
import { requireAuth } from '../../../../features/cms/lib/auth';

export const prerender = false;

/**
 * GET /api/games/[matchId]/state
 * Get current game state
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

    const state = await getGameState(matchId);

    if (!state) {
      return new Response(JSON.stringify({ error: 'Match not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(state), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error fetching game state:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch game state' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * PUT /api/games/[matchId]/state
 * Update game state (admin only)
 */
export const PUT: APIRoute = async ({ params, request }) => {
  try {
    await requireAuth(request);
  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const matchId = params.matchId;
    if (!matchId) {
      return new Response(JSON.stringify({ error: 'Match ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await request.json();
    const success = await updateGameState(matchId, data);

    if (!success) {
      return new Response(JSON.stringify({ error: 'Failed to update game state' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const updatedState = await getGameState(matchId);
    return new Response(JSON.stringify(updatedState), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error updating game state:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to update game state' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
