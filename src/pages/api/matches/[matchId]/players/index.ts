import type { APIRoute } from 'astro';
import { getMatchPlayers, getMatchPlayersByTeam } from '../../../../../features/cms/lib/queries';
import { createMatchPlayer } from '../../../../../features/cms/lib/mutations';
import { requireAuth } from '../../../../../features/cms/lib/auth';

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
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error fetching match players:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch match players' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
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

    return new Response(JSON.stringify(matchPlayer), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error creating match player:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to create match player' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

