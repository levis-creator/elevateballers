import type { APIRoute } from 'astro';
import { requireAnyPermission } from '../../../features/rbac/middleware';
import { handleApiError } from '../../../lib/apiError';
import { fetchLeadersData } from '../../../features/stats/data/datasources/leaders-v2';
import type { StatKey } from '../../../features/stats/domain/entities/leaders-v2';

export const prerender = false;

const VALID_STATS: StatKey[] = ['Points', 'Rebounds', 'Assists', 'Steals', 'Blocks', '3-Pointers'];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

/**
 * Admin leaders board. Reuses the SAME event-based per-game computation as the
 * public stats page (`fetchLeadersData`), but returns REAL data only — no demo
 * fallback — so the dashboard never shows fabricated numbers. Sorted by the
 * requested stat (default Points = PPG) for the most recent season.
 *
 * GET /api/stats/leaders?stat=Points&limit=5&season=<name>
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    await requireAnyPermission(request, ['players:read', 'matches:read']);

    const url = new URL(request.url);
    const statParam = url.searchParams.get('stat') as StatKey | null;
    const stat: StatKey = statParam && VALID_STATS.includes(statParam) ? statParam : 'Points';
    const limit = Math.min(20, Math.max(1, parseInt(url.searchParams.get('limit') || '5', 10)));
    const seasonParam = url.searchParams.get('season')?.trim() || '';

    const data = await fetchLeadersData();
    if (!data || !data.rows.length) {
      return json({ stat, season: null, leaders: [] });
    }

    const season = seasonParam || data.defaultSeason;
    const leaders = data.rows
      .filter((r) => (!season || r.season === season) && r.gp >= data.minGames)
      .sort((a, b) => (b.vals[stat] ?? 0) - (a.vals[stat] ?? 0))
      .slice(0, limit)
      .map((r) => ({
        playerId: r.playerId,
        name: r.name,
        team: r.team,
        initials: r.initials,
        value: r.vals[stat] ?? 0,
        gp: r.gp,
        href: r.href,
      }));

    return json({ stat, season, leaders });
  } catch (error) {
    return handleApiError(error, 'stats leaders', request);
  }
};
