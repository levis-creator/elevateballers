import type { APIRoute } from 'astro';
import { getSeasons } from '../../../features/cms/lib/queries';
import { createSeason } from '../../../features/cms/lib/mutations';
import { requirePermission } from '../../../features/rbac/middleware';
import { logAudit } from '../../../features/cms/lib/audit';

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
    return new Response(JSON.stringify({ error: 'Failed to fetch seasons' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
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
  } catch (error: any) {
    console.error('Error creating season:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to create season' }),
      {
        status: error.message === 'Unauthorized' || error.message.includes('Forbidden') ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
