import type { APIRoute } from 'astro';
import { getMatchEvents, getMatchEventsByTeam, getMatchEventsByType } from '../../../../../features/cms/lib/queries';
import { createMatchEvent } from '../../../../../features/cms/lib/mutations';
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
    const eventType = url.searchParams.get('eventType');
    
    let events;
    if (teamId) {
      events = await getMatchEventsByTeam(matchId, teamId);
    } else if (eventType) {
      events = await getMatchEventsByType(matchId, eventType);
    } else {
      events = await getMatchEvents(matchId);
    }

    return new Response(JSON.stringify(events), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error fetching match events:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch match events' }), {
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
    // Check if match is completed - block adding events
    const { getMatchById } = await import('../../../../../features/cms/lib/queries');
    const match = await getMatchById(matchId);
    if (match && match.status === 'COMPLETED') {
      return new Response(
        JSON.stringify({ error: 'Cannot add events to a completed match' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    const body = await request.json();
    const matchEvent = await createMatchEvent({
      ...body,
      matchId,
    });

    if (!matchEvent) {
      return new Response(JSON.stringify({ error: 'Failed to create match event' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(matchEvent), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error creating match event:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to create match event' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

