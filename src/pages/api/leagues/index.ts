import type { APIRoute } from 'astro';
import { getLeagues } from '../../../features/cms/lib/queries';
import { createLeague } from '../../../features/cms/lib/mutations';
import { requirePermission } from '../../../features/rbac/middleware';
import { logAudit } from '../../../features/cms/lib/audit';

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
    console.error('Error fetching leagues:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch leagues' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
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
  } catch (error: any) {
    console.error('Error creating league:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to create league' }),
      {
        status: error.message === 'Unauthorized' || error.message.includes('Forbidden') ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
