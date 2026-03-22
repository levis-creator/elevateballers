import type { APIRoute } from 'astro';
import { getSeasons } from '../../../features/seasons/lib/queries/seasons';
import { createSeason } from '../../../features/seasons/lib/mutations/seasons';
import { requirePermission } from '../../../features/rbac/domain/usecases/middleware';
import { logAudit } from '../../../features/audit/lib/audit';

import { handleApiError } from '../../../lib/apiError';
export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  try {
    const activeOnly = url.searchParams.get('activeOnly') === 'true';
    const leagueId = url.searchParams.get('leagueId') || undefined;
    const seasons = await getSeasons(activeOnly, leagueId);
    return new Response(JSON.stringify(seasons), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching seasons:', error);
    return handleApiError(error, "fetch seasons");
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    await requirePermission(request, 'seasons:create');
    const data = await request.json();

    if (!data.name || !data.startDate || !data.endDate || !data.leagueId) {
      return new Response(
        JSON.stringify({ error: 'Season name, start date, end date, and league ID are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const season = await createSeason(data);
    await logAudit(request, 'SEASON_CREATED', {
      seasonId: season.id,
      name: season.name,
      leagueId: season.leagueId,
    });
    return new Response(JSON.stringify(season), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'create season', request);
  }
};
