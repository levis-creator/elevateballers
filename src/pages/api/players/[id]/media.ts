import type { APIRoute } from 'astro';
import { getPlayerMedia } from '../../../../features/player/application/player-profile';
import { handleApiError } from '../../../../lib/apiError';
export const prerender = false;
export const GET: APIRoute = async ({ params, request }) => {
  try { return new Response(JSON.stringify(await getPlayerMedia(params.id!)), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, s-maxage=120' } }); }
  catch (error) { return handleApiError(error, 'fetch player media', request); }
};
