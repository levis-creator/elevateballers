import type { APIRoute } from 'astro';
import { getGameState, getMatchWithGameState } from '../../../../features/game-tracking/data/datasources/queries';
import { updateGameState } from '../../../../features/game-tracking/data/datasources/mutations';
import { requireAuth } from '@/features/auth/lib/auth';
import { logAudit } from '../../../../features/audit/lib/audit';

import { handleApiError } from '../../../../lib/apiError';
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
    return handleApiError(error, "fetch game state");
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
      return handleApiError(error, "update game state");
    }

    const updatedState = await getGameState(matchId);
    await logAudit(request, 'GAME_STATE_UPDATED', { matchId });
    return new Response(JSON.stringify(updatedState), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error updating game state:', error);
    return handleApiError(error, "update game state");
  }
};
