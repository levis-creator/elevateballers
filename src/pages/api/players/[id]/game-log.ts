import type { APIRoute } from 'astro';
import { getPlayerGameLog } from '../../../../features/player/application/player-profile';
import { handleApiError } from '../../../../lib/apiError';
export const prerender = false;
export const GET: APIRoute = async ({ params, url, request }) => {
  try { const page = Math.max(1, Number(url.searchParams.get('page') || 1)); const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || 25))); return new Response(JSON.stringify(await getPlayerGameLog(params.id!, { leagueSeasonId: url.searchParams.get('leagueSeasonId') || undefined, page, limit })), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, s-maxage=60' } }); }
  catch (error) { return handleApiError(error, 'fetch player game log', request); }
};
