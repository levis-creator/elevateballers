import type { APIRoute } from 'astro';
import { getPlayerTeamHistory } from '../../../../features/player/lib/queries';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  try {
    const playerId = params.id;
    if (!playerId) {
      return new Response(JSON.stringify({ error: 'Player ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const history = await getPlayerTeamHistory(playerId);

    return new Response(JSON.stringify(history), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error fetching player team history:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch team history' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
