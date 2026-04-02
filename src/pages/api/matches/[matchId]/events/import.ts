import type { APIRoute } from 'astro';
import { requireAuth } from '../../../../../features/cms/lib/auth';
import { getMatchById } from '../../../../../features/cms/lib/queries';
import { bulkCreateMatchEvents } from '../../../../../features/cms/lib/mutations/matchEvent';
import { handleApiError } from '../../../../../lib/apiError';

const VALID_EVENT_TYPES = new Set([
  'TWO_POINT_MADE', 'TWO_POINT_MISSED',
  'THREE_POINT_MADE', 'THREE_POINT_MISSED',
  'FREE_THROW_MADE', 'FREE_THROW_MISSED',
  'ASSIST', 'REBOUND_OFFENSIVE', 'REBOUND_DEFENSIVE',
  'STEAL', 'BLOCK', 'TURNOVER',
  'FOUL_PERSONAL', 'FOUL_TECHNICAL', 'FOUL_FLAGRANT',
  'SUBSTITUTION_IN', 'SUBSTITUTION_OUT',
  'TIMEOUT', 'INJURY', 'BREAK', 'PLAY_RESUMED', 'OTHER',
]);

export const POST: APIRoute = async ({ params, request }) => {
  try {
    await requireAuth(request);
  } catch {
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
    const match = await getMatchById(matchId);
    if (!match) {
      return new Response(JSON.stringify({ error: 'Match not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (match.status === 'COMPLETED') {
      return new Response(
        JSON.stringify({ error: 'Cannot import events into a completed match' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const rows: unknown[] = Array.isArray(body?.events) ? body.events : [];

    if (rows.length === 0) {
      return new Response(JSON.stringify({ error: 'No events provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (rows.length > 500) {
      return new Response(JSON.stringify({ error: 'Maximum 500 events per import' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate and map rows
    const validationErrors: { row: number; message: string }[] = [];
    const events: Parameters<typeof bulkCreateMatchEvents>[1] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as Record<string, unknown>;
      const rowNum = i + 1;

      const eventType = String(row.eventType ?? '').trim().toUpperCase();
      if (!eventType || !VALID_EVENT_TYPES.has(eventType)) {
        validationErrors.push({ row: rowNum, message: `Invalid eventType: "${row.eventType}"` });
        continue;
      }

      const minute = Number(row.minute);
      if (isNaN(minute) || minute < 0) {
        validationErrors.push({ row: rowNum, message: `Invalid minute: "${row.minute}"` });
        continue;
      }

      events.push({
        eventType: eventType as any,
        minute,
        period: row.period !== undefined && row.period !== '' ? Number(row.period) : undefined,
        secondsRemaining:
          row.secondsRemaining !== undefined && row.secondsRemaining !== ''
            ? Number(row.secondsRemaining)
            : undefined,
        playerId: row.playerId ? String(row.playerId) : undefined,
        teamId: row.teamId ? String(row.teamId) : undefined,
        assistPlayerId: row.assistPlayerId ? String(row.assistPlayerId) : undefined,
        description: row.description ? String(row.description) : undefined,
      });
    }

    if (validationErrors.length > 0 && events.length === 0) {
      return new Response(JSON.stringify({ error: 'All rows failed validation', validationErrors }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await bulkCreateMatchEvents(matchId, events);

    return new Response(
      JSON.stringify({
        created: result.created,
        errors: [...validationErrors, ...result.errors],
        validationErrors,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return handleApiError(error, 'import match events');
  }
};
