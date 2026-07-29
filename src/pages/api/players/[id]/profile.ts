import type { APIRoute } from 'astro';
import { requirePermission } from '../../../../features/rbac/middleware';
import { getPlayerProfile } from '../../../../features/player/application/player-profile';
import { handleApiError } from '../../../../lib/apiError';
export const prerender = false;
export const GET: APIRoute = async ({ params, request }) => {
  try {
    let includePrivate = false;
    try { await requirePermission(request, 'players:update'); includePrivate = true; } catch { /* public profile */ }
    const player = await getPlayerProfile(params.id!, includePrivate);
    if (!player) return new Response(JSON.stringify({ error: 'Player not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    if (!includePrivate) { delete player.email; delete player.phone; }
    return new Response(JSON.stringify(player), { headers: { 'Content-Type': 'application/json', 'Cache-Control': includePrivate ? 'no-store' : 'public, s-maxage=120' } });
  } catch (error) { return handleApiError(error, 'fetch player profile', request); }
};
