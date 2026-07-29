import type { APIRoute } from 'astro';
import { getPlayerStatistics } from '../../../../features/player/application/player-profile';
import { handleApiError } from '../../../../lib/apiError';
export const prerender = false;
export const GET: APIRoute = async ({ params, url, request }) => {
  try { return new Response(JSON.stringify(await getPlayerStatistics(params.id!, url.searchParams.get('leagueSeasonId') || undefined)), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, s-maxage=60' } }); }
  catch (error) { return handleApiError(error, 'fetch player statistics', request); }
};
