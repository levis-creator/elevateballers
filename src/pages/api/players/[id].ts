import type { APIRoute } from 'astro';
import { getPlayerById } from '../../../features/cms/lib/queries';
import { updatePlayer, deletePlayer } from '../../../features/cms/lib/mutations';
import { requireAdmin } from '../../../features/cms/lib/auth';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  try {
    const player = await getPlayerById(params.id!);

    if (!player) {
      return new Response(JSON.stringify({ error: 'Player not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(player), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching player:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch player' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    await requireAdmin(request);
    const data = await request.json();

    // Convert jerseyNumber to number if provided
    if (data.jerseyNumber !== undefined) {
      data.jerseyNumber = data.jerseyNumber ? parseInt(data.jerseyNumber) : null;
    }

    // Handle teamId - convert empty string to undefined
    if (data.teamId === '') {
      data.teamId = undefined;
    }

    const player = await updatePlayer(params.id!, data);

    if (!player) {
      return new Response(JSON.stringify({ error: 'Player not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(player), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error updating player:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to update player' }),
      {
        status: error.message === 'Unauthorized' || error.message.includes('Forbidden') ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    await requireAdmin(request);
    const success = await deletePlayer(params.id!);

    if (!success) {
      return new Response(JSON.stringify({ error: 'Failed to delete player' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(null, { status: 204 });
  } catch (error: any) {
    console.error('Error deleting player:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to delete player' }),
      {
        status: error.message === 'Unauthorized' || error.message.includes('Forbidden') ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

