import type { APIRoute } from 'astro';
import { getMatchEventById } from '@/features/cms/lib/queries';
import { updateMatchEvent, deleteMatchEvent } from '@/features/cms/lib/mutations';
import { requireAuth } from '@/features/cms/lib/auth';
import { logAudit } from '@/features/cms/lib/audit';

import { handleApiError } from '../../../../../lib/apiError';
export const GET: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Event ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const matchEvent = await getMatchEventById(id);
    if (!matchEvent) {
      return new Response(JSON.stringify({ error: 'Match event not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(matchEvent), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error fetching match event:', error);
    return handleApiError(error, "fetch match event");
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
    return new Response(JSON.stringify({ error: 'Event ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Check if match is completed - block editing events unless the
    // "Allow editing matches after completion" admin toggle is on.
    const matchEvent = await getMatchEventById(id);
    if (matchEvent) {
      const { getMatchById, getSiteSettingByKey } = await import('@/features/cms/lib/queries');
      const match = await getMatchById(matchEvent.matchId);
      if (match && match.status === 'COMPLETED') {
        const setting = await getSiteSettingByKey('match_allow_edit_after_completion').catch(() => null);
        if (setting?.value !== 'true') {
          return new Response(
            JSON.stringify({
              error:
                'Cannot edit events in a completed match. Enable "Allow editing matches after completion" in Site Settings → Matches to override.',
            }),
            {
              status: 403,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
      }
    }
    
    const body = await request.json();
    const updatedEvent = await updateMatchEvent(id, body);

    if (!updatedEvent) {
      return new Response(JSON.stringify({ error: 'Failed to update match event' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await logAudit(request, 'MATCH_EVENT_UPDATED', {
      matchId: updatedEvent.matchId,
      eventId: updatedEvent.id,
      eventType: updatedEvent.type,
    });

    return new Response(JSON.stringify(updatedEvent), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error updating match event:', error);
    return handleApiError(error, "update match event");
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
    return new Response(JSON.stringify({ error: 'Event ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Check if match is completed - block deleting events unless the
    // "Allow editing matches after completion" admin toggle is on.
    const matchEvent = await getMatchEventById(id);
    if (matchEvent) {
      const { getMatchById, getSiteSettingByKey } = await import('@/features/cms/lib/queries');
      const match = await getMatchById(matchEvent.matchId);
      if (match && match.status === 'COMPLETED') {
        const setting = await getSiteSettingByKey('match_allow_edit_after_completion').catch(() => null);
        if (setting?.value !== 'true') {
          return new Response(
            JSON.stringify({
              error:
                'Cannot delete events from a completed match. Enable "Allow editing matches after completion" in Site Settings → Matches to override.',
            }),
            {
              status: 403,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
      }
    }
    
    const success = await deleteMatchEvent(id);
    if (!success) {
      return new Response(JSON.stringify({ error: 'Failed to delete match event' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await logAudit(request, 'MATCH_EVENT_DELETED', {
      eventId: id,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error deleting match event:', error);
    return handleApiError(error, "delete match event");
  }
};
