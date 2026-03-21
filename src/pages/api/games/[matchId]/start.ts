import type { APIRoute } from 'astro';
import { startGame } from '../../../../features/game-tracking/lib/mutations';
import { getGameState } from '../../../../features/game-tracking/lib/queries';
import { requireAuth } from '../../../../features/cms/lib/auth';
import { logAudit } from '../../../../features/cms/lib/audit';

import { handleApiError } from '../../../../lib/apiError';
export const prerender = false;

/**
 * POST /api/games/[matchId]/start
 * Start a game (initialize game state)
 */
export const POST: APIRoute = async ({ params, request }) => {
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

    const body = await request.json().catch(() => ({}));
    const gameRulesId = body.gameRulesId;

    const success = await startGame(matchId, gameRulesId);

    if (!success) {
      return handleApiError(error, "start game");
    }

    const state = await getGameState(matchId);
    await logAudit(request, 'GAME_STARTED', { matchId, gameRulesId });
    return new Response(JSON.stringify(state), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error starting game:', error);
    return handleApiError(error, "start game");
  }
};
