import type { APIRoute } from 'astro';
import { getMatchEvents, getMatchEventsByTeam, getMatchEventsByType } from '../../../../../features/matches/data/datasources/queries';
import { createMatchEvent } from '../../../../../features/matches/data/datasources/mutations';
import { requireAuth } from '@/features/auth/lib/auth';
import { logAudit } from '../../../../../features/audit/lib/audit';

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
    return handleApiError(error, "fetch match events");
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
    const { getMatchById } = await import('../../../../../features/matches/data/datasources/queries');
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
      return handleApiError(error, "create match event");
    }

    await logAudit(request, 'MATCH_EVENT_CREATED', {
      matchId,
      eventId: matchEvent.id,
      eventType: matchEvent.type,
    });

    return new Response(JSON.stringify(matchEvent), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error creating match event:', error);
    return handleApiError(error, "create match event");
  }
};
