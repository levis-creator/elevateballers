import type { APIRoute } from 'astro';
import { toggleGameClock } from '../../../../features/game-tracking/data/datasources/mutations';
import { getGameState } from '../../../../features/game-tracking/data/datasources/queries';
import { requireAuth } from '@/features/auth/lib/auth';
import { logAudit } from '../../../../features/audit/lib/audit';

import { handleApiError } from '../../../../lib/apiError';
export const prerender = false;

/**
 * POST /api/games/[matchId]/pause
 * Pause or resume game clock
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
    const running = body.running !== undefined ? body.running : undefined;
    const clockSeconds = body.clockSeconds !== undefined ? body.clockSeconds : undefined;

    const success = await toggleGameClock(matchId, running, clockSeconds);

    if (!success) {
      return handleApiError(error, "toggle game clock");
    }

    const state = await getGameState(matchId);
    await logAudit(request, 'GAME_CLOCK_TOGGLED', { matchId, running, clockSeconds });
    return new Response(JSON.stringify(state), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error toggling game clock:', error);
    return handleApiError(error, "toggle game clock");
  }
};
