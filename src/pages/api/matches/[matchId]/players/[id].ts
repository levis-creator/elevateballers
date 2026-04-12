import type { APIRoute } from 'astro';
import { getMatchPlayerById } from '../../../../../features/cms/lib/queries';
import { updateMatchPlayer, deleteMatchPlayer } from '../../../../../features/cms/lib/mutations';
import { requireAuth } from '../../../../../features/cms/lib/auth';
import { logAudit } from '../../../../../features/cms/lib/audit';

import { handleApiError } from '../../../../../lib/apiError';
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
    return handleApiError(error, "fetch match player");
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

    await logAudit(request, 'MATCH_PLAYER_UPDATED', {
      matchPlayerId: matchPlayer.id,
      matchId: matchPlayer.matchId,
      playerId: matchPlayer.playerId,
      teamId: matchPlayer.teamId,
    });

    return new Response(JSON.stringify(matchPlayer), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error updating match player:', error);
    return handleApiError(error, "update match player");
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

    await logAudit(request, 'MATCH_PLAYER_REMOVED', {
      matchPlayerId: id,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error deleting match player:', error);
    return handleApiError(error, "delete match player");
  }
};
