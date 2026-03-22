import type { APIRoute } from 'astro';
import { getSeasonById } from '../../../features/seasons/lib/queries/seasons';
import { updateSeason, deleteSeason } from '../../../features/seasons/lib/mutations/seasons';
import { requirePermission } from '../../../features/rbac/domain/usecases/middleware';
import { logAudit } from '../../../features/audit/lib/audit';

import { handleApiError } from '../../../lib/apiError';
export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  try {
    const season = await getSeasonById(params.id!);
    if (!season) {
      return new Response(JSON.stringify({ error: 'Season not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify(season), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'fetch season');
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'seasons:update');
    const data = await request.json();
    const season = await updateSeason(params.id!, data);
    if (!season) {
      return new Response(JSON.stringify({ error: 'Season not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify(season), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'update season', request);
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'seasons:update');
    const success = await deleteSeason(params.id!);
    if (!success) {
      return new Response(JSON.stringify({ error: 'Season not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    await logAudit(request, 'SEASON_DELETED', {
      seasonId: params.id,
    });
    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error, 'delete season', request);
  }
};
