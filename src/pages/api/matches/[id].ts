import type { APIRoute } from 'astro';
import { getMatchById, getMatchWithFullDetails } from '../../../features/matches/data/datasources/queries';
import { updateMatch, deleteMatch } from '../../../features/matches/data/datasources/mutations';
import { requirePermission } from '../../../features/rbac/domain/usecases/middleware';
import { logAudit } from '../../../features/audit/lib/audit';
import { json, handleApiError } from '../../../lib/apiError';

export const prerender = false;

export const GET: APIRoute = async ({ params, url }) => {
  try {
    const includeDetails = url.searchParams.get('includeDetails') === 'true';
    const match = includeDetails
      ? await getMatchWithFullDetails(params.id!)
      : await getMatchById(params.id!);

    if (!match) return json({ error: 'Match not found' }, 404);

    return new Response(JSON.stringify(match), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    return handleApiError(error, 'fetch match', request);
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'matches:update');

    const existingMatch = await getMatchById(params.id!);
    if (existingMatch?.status === 'COMPLETED') {
      return json({ error: 'Cannot edit a completed match' }, 403);
    }

    const data = await request.json();

    if (data.date) data.date = new Date(data.date);

    if (data.stage !== undefined) {
      const s = typeof data.stage === 'string' ? data.stage.trim() : data.stage;
      if (s === '__none' || s === '') data.stage = undefined;
    }

    const match = await updateMatch(params.id!, data);
    if (!match) return json({ error: 'Match not found' }, 404);

    await logAudit(request, 'MATCH_UPDATED', {
      matchId: match.id,
      leagueId: match.leagueId,
      date: match.date,
      status: match.status,
    });

    return json(match, 200);
  } catch (error) {
    return handleApiError(error, 'update match', request);
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'matches:update');
    const success = await deleteMatch(params.id!);

    if (!success) return json({ error: 'Failed to delete match' }, 500);

    await logAudit(request, 'MATCH_DELETED', { matchId: params.id });

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error, 'delete match', request);
  }
};
