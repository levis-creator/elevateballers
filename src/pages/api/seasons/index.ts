import type { APIRoute } from 'astro';
import { getSeasonOptions, getSeasons } from '../../../features/cms/lib/queries';
import { createSeason } from '../../../features/cms/lib/mutations';
import { requirePermission } from '../../../features/rbac/middleware';
import { logAudit } from '../../../features/cms/lib/audit';

import { handleApiError } from '../../../lib/apiError';
import { cacheGet, cacheSet, cacheInvalidatePattern } from '../../../lib/cache';
export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  try {
    const activeOnly = url.searchParams.get('activeOnly') === 'true';
    const leagueId = url.searchParams.get('leagueId') || undefined;
    // Opt-in: only the admin board needs played-match counts.
    const withCompletedCounts = url.searchParams.get('counts') === 'matches';
    const compact = url.searchParams.get('compact') === 'true';
    const cacheKey = `admin:reference:seasons:${activeOnly ? 'active' : 'all'}:${leagueId || 'all'}:${withCompletedCounts ? 'counts' : 'plain'}:${compact ? 'compact' : 'full'}`;
    const cached = await cacheGet<unknown[]>(cacheKey);
    if (cached) return new Response(JSON.stringify(cached), { headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' } });
    const compactSeasons = compact
      ? await getSeasonOptions(leagueId)
      : await getSeasons(activeOnly, leagueId, withCompletedCounts);
    await cacheSet(cacheKey, compactSeasons, 30);
    return new Response(JSON.stringify(compactSeasons), {
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

    if (!data.name || !data.startDate || !data.endDate) {
      return new Response(
        JSON.stringify({ error: 'Season name, start date, and end date are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (data.conferences !== undefined) {
      const invalid =
        !Array.isArray(data.conferences) ||
        data.conferences.some((c: unknown) => typeof (c as { name?: unknown })?.name !== 'string' || !(c as { name: string }).name.trim());
      if (invalid) {
        return new Response(
          JSON.stringify({ error: 'Each conference must have a non-empty name' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    const season = await createSeason(data);
    await logAudit(request, 'SEASON_CREATED', {
      seasonId: season.id,
      name: season.name,
      leagueIds: data.leagueIds ?? [],
      conferences: data.conferences?.length ?? 0,
    });
    await cacheInvalidatePattern('admin:reference:seasons:*');
    return new Response(JSON.stringify(season), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'create season', request);
  }
};
