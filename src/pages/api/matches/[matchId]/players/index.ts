import type { APIRoute } from 'astro';
import { getMatchPlayers, getMatchPlayersByTeam } from '../../../../../features/cms/lib/queries';
import { createMatchPlayer } from '../../../../../features/cms/lib/mutations';
import { requireAuth } from '../../../../../features/cms/lib/auth';
import { logAudit } from '../../../../../features/cms/lib/audit';

import { handleApiError } from '../../../../../lib/apiError';
export const GET: APIRoute = async ({ params, url, request }) => {
  const matchId = params.matchId;
  if (!matchId) {
    return new Response(JSON.stringify({ error: 'Match ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const teamId = url.searchParams.get('teamId');
    
    let players;
    if (teamId) {
      players = await getMatchPlayersByTeam(matchId, teamId);
    } else {
      players = await getMatchPlayers(matchId);
    }

    return new Response(JSON.stringify(players), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // Match players only change on substitutions — cache briefly at edge
        // to absorb polling bursts from multiple concurrent admins/viewers.
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
      },
    });
  } catch (error: any) {
    console.error('Error fetching match players:', error);
    return handleApiError(error, "fetch match players");
  }
};

export const POST: APIRoute = async ({ params, request }) => {
  try {
    await requireAuth(request);
  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const matchId = params.matchId;
  if (!matchId) {
    return new Response(JSON.stringify({ error: 'Match ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const matchPlayer = await createMatchPlayer({
      ...body,
      matchId,
    });

    if (!matchPlayer) {
      return new Response(JSON.stringify({ error: 'Failed to create match player' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await logAudit(request, 'MATCH_PLAYER_ADDED', {
      matchId,
      matchPlayerId: matchPlayer.id,
      playerId: matchPlayer.playerId,
      teamId: matchPlayer.teamId,
    });

    return new Response(JSON.stringify(matchPlayer), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error creating match player:', error);
    return handleApiError(error, "create match player");
  }
};
