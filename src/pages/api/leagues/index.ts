import type { APIRoute } from 'astro';
import { getLeagues } from '../../../features/leagues/lib/queries/leagues';
import { createLeague } from '../../../features/leagues/lib/mutations/leagues';
import { requirePermission } from '../../../features/rbac/domain/usecases/middleware';
import { logAudit } from '../../../features/audit/lib/audit';
import { handleApiError } from '../../../lib/apiError';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const activeOnly = url.searchParams.get('active') === 'true';

    const leagues = await getLeagues(activeOnly);

    return new Response(JSON.stringify(leagues), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'fetch leagues', request);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    await requirePermission(request, 'leagues:create');
    const data = await request.json();

    // Validate required fields
    if (!data.name) {
      return new Response(
        JSON.stringify({ error: 'League name is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const league = await createLeague({
      name: data.name,
      slug: data.slug,
      description: data.description,
      logo: data.logo,
      season: data.season,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      active: data.active !== undefined ? data.active : true,
    });

    await logAudit(request, 'LEAGUE_CREATED', {
      leagueId: league.id,
      name: league.name,
    });

    return new Response(JSON.stringify(league), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'create league', request);
  }
};
