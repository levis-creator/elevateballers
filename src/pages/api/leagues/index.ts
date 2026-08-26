import type { APIRoute } from 'astro';
import { getLeagueOptions, getLeagues } from '../../../features/cms/lib/queries';
import { createLeague } from '../../../features/cms/lib/mutations';
import { requirePermission } from '../../../features/rbac/middleware';
import { logAudit } from '../../../features/cms/lib/audit';
import { handleApiError } from '../../../lib/apiError';
import { cacheGet, cacheSet, cacheInvalidatePattern } from '../../../lib/cache';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const activeOnly = url.searchParams.get('active') === 'true';
    const withTeamCounts = url.searchParams.get('counts') === 'teams';
    const compact = url.searchParams.get('compact') === 'true';
    const cacheKey = `admin:reference:leagues:${activeOnly ? 'active' : 'all'}:${withTeamCounts ? 'counts' : 'plain'}:${compact ? 'compact' : 'full'}`;
    const cached = await cacheGet<unknown[]>(cacheKey);
    if (cached) return new Response(JSON.stringify(cached), { headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' } });

    const leagues = compact ? await getLeagueOptions() : await getLeagues(activeOnly, withTeamCounts);
    await cacheSet(cacheKey, leagues, 30);

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
      active: data.active !== undefined ? data.active : true,
      registrationOpen: data.registrationOpen,
      registrationOpensAt: data.registrationOpensAt,
      registrationClosesAt: data.registrationClosesAt,
    });

    await logAudit(request, 'LEAGUE_CREATED', {
      leagueId: league.id,
      name: league.name,
    });
    await cacheInvalidatePattern('admin:reference:leagues:*');

    return new Response(JSON.stringify(league), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'create league', request);
  }
};
