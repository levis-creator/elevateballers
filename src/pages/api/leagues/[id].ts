import type { APIRoute } from 'astro';
import { getLeagueById } from '../../../features/cms/lib/queries';
import { updateLeague, deleteLeague } from '../../../features/cms/lib/mutations';
import { requirePermission } from '../../../features/rbac/middleware';
import { logAudit } from '../../../features/cms/lib/audit';
import { handleApiError } from '../../../lib/apiError';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  try {
    const league = await getLeagueById(params.id!);

    if (!league) {
      return new Response(JSON.stringify({ error: 'League not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(league), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'fetch league');
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'leagues:update');
    const data = await request.json();

    // Convert date strings to Date if provided
    if (data.startDate) {
      data.startDate = new Date(data.startDate);
    }
    if (data.endDate) {
      data.endDate = new Date(data.endDate);
    }

    const league = await updateLeague(params.id!, data);

    if (!league) {
      return new Response(JSON.stringify({ error: 'League not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(league), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'update league', request);
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'leagues:update');
    const success = await deleteLeague(params.id!);

    if (!success) {
      return new Response(JSON.stringify({ error: 'Failed to delete league' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await logAudit(request, 'LEAGUE_DELETED', {
      leagueId: params.id,
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error, 'delete league', request);
  }
};
