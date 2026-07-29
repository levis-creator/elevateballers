import type { APIRoute } from 'astro';
import { requirePermission } from '../../../../features/rbac/middleware';
import { getPlayerRegistrationHistory } from '../../../../features/player/application/player-profile';
import { handleApiError } from '../../../../lib/apiError';
export const prerender = false;
export const GET: APIRoute = async ({ params, request }) => {
  try { await requirePermission(request, 'players:update'); const history = await getPlayerRegistrationHistory(params.id!); return new Response(JSON.stringify(history), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }); }
  catch (error) { return handleApiError(error, 'fetch player registration history', request); }
};
