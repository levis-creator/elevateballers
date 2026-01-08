import type { APIRoute } from 'astro';
import { getPlayByPlay } from '../../../../features/game-tracking/lib/queries';

export const prerender = false;

/**
 * GET /api/games/[matchId]/play-by-play
 * Get play-by-play log for a match
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

    const playByPlay = await getPlayByPlay(matchId);

    return new Response(JSON.stringify(playByPlay), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error fetching play-by-play:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch play-by-play' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
