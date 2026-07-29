import type { APIRoute } from 'astro';
import { requirePermission } from '../../../../features/rbac/middleware';
import { getPlayerRegistrationOptions } from '../../../../features/player/application/player-profile';
import { handleApiError } from '../../../../lib/apiError';

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  try {
    // Reading valid editions is part of player administration. The roster
    // mutation remains protected by teams:update in /api/season-rosters.
    await requirePermission(request, 'players:update');
    const options = await getPlayerRegistrationOptions(params.id!);
    return new Response(JSON.stringify(options), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handleApiError(error, 'fetch player registration options', request);
  }
};
