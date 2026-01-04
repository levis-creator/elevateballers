import type { APIRoute } from 'astro';
import { getMatchPlayerById } from '../../../../../../features/cms/lib/queries';
import { updateMatchPlayer, deleteMatchPlayer } from '../../../../../../features/cms/lib/mutations';
import { requireAuth } from '../../../../../../features/cms/lib/auth';

export const GET: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Player ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const matchPlayer = await getMatchPlayerById(id);
    if (!matchPlayer) {
      return new Response(JSON.stringify({ error: 'Match player not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(matchPlayer), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error fetching match player:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch match player' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    await requireAuth(request);
  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const id = params.id;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Player ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const matchPlayer = await updateMatchPlayer(id, body);

    if (!matchPlayer) {
      return new Response(JSON.stringify({ error: 'Failed to update match player' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(matchPlayer), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error updating match player:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to update match player' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    await requireAuth(request);
  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const id = params.id;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Player ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const success = await deleteMatchPlayer(id);
    if (!success) {
      return new Response(JSON.stringify({ error: 'Failed to delete match player' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error deleting match player:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete match player' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

