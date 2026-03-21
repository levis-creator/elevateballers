import type { APIRoute } from 'astro';
import { endGame } from '../../../../features/game-tracking/lib/mutations';
import { getGameState } from '../../../../features/game-tracking/lib/queries';
import { requireAuth } from '../../../../features/cms/lib/auth';
import { logAudit } from '../../../../features/cms/lib/audit';

import { handleApiError } from '../../../../lib/apiError';
export const prerender = false;

/**
 * POST /api/games/[matchId]/end
 * End a game (set match status to COMPLETED)
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

    const success = await endGame(matchId);

    if (!success) {
      return handleApiError(error, "end game");
    }

    const state = await getGameState(matchId);
    await logAudit(request, 'GAME_ENDED', { matchId });
    return new Response(JSON.stringify(state), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error ending game:', error);
    return handleApiError(error, "end game");
  }
};
