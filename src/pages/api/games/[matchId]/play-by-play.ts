import type { APIRoute } from 'astro';
import { getPlayByPlay, getPlayByPlayChanges } from '../../../../features/game-tracking/lib/queries';

import { handleApiError } from '../../../../lib/apiError';
export const prerender = false;

/**
 * GET /api/games/[matchId]/play-by-play
 * Get play-by-play log for a match
 */
export const GET: APIRoute = async ({ params, request }) => {
  try {
    const matchId = params.matchId;
    if (!matchId) {
      return new Response(JSON.stringify({ error: 'Match ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // `?since=<ISO time>` returns only events added or changed after it,
    // undone ones included, so live consoles on other devices stay in step.
    // `serverTime` is the cursor for the next call (server clock, not client).
    const since = new URL(request.url).searchParams.get('since');
    const sinceDate = since ? new Date(since) : null;
    if (sinceDate && !Number.isNaN(sinceDate.getTime())) {
      const serverTime = new Date().toISOString();
      const changes = await getPlayByPlayChanges(matchId, sinceDate);
      return new Response(JSON.stringify({ changes, serverTime }), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    const serverTime = new Date().toISOString();
    const playByPlay = await getPlayByPlay(matchId);

    return new Response(JSON.stringify({ ...playByPlay, serverTime }), {
      headers: {
        'Content-Type': 'application/json',
        // Short edge cache — absorbs polling bursts, still feels instant
        'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=10',
      },
    });
  } catch (error: any) {
    console.error('Error fetching play-by-play:', error);
    return handleApiError(error, "fetch play-by-play", request);
  }
};
