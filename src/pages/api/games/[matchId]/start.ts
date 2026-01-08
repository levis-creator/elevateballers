import type { APIRoute } from 'astro';
import { startGame } from '../../../../features/game-tracking/lib/mutations';
import { getGameState } from '../../../../features/game-tracking/lib/queries';
import { requireAuth } from '../../../../features/cms/lib/auth';

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
      return new Response(JSON.stringify({ error: 'Failed to start game' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const state = await getGameState(matchId);
    return new Response(JSON.stringify(state), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error starting game:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to start game' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
