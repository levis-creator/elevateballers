import type { APIRoute } from 'astro';
import { getPlayerMatchEvents } from '../../../../features/player/lib/queries';

export const prerender = false;

/**
 * GET /api/players/[id]/events
 * Get player events for a specific match
 * Query parameters:
 * - matchId: Match ID (required)
 */
export const GET: APIRoute = async ({ params, request }) => {
  try {
    const playerId = params.id;
    if (!playerId) {
      return new Response(JSON.stringify({ error: 'Player ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const matchId = url.searchParams.get('matchId');

    if (!matchId) {
      return new Response(JSON.stringify({ error: 'Match ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const events = await getPlayerMatchEvents(matchId, playerId);

    return new Response(JSON.stringify(events), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error fetching player events:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch player events' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
