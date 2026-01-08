import type { APIRoute } from 'astro';
import { toggleGameClock } from '../../../../features/game-tracking/lib/mutations';
import { getGameState } from '../../../../features/game-tracking/lib/queries';
import { requireAuth } from '../../../../features/cms/lib/auth';

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
      return new Response(JSON.stringify({ error: 'Failed to toggle game clock' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const state = await getGameState(matchId);
    return new Response(JSON.stringify(state), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error toggling game clock:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to toggle game clock' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
