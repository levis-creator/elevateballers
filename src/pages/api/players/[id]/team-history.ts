import type { APIRoute } from 'astro';
import { getPlayerTeamHistory } from '../../../../features/player/lib/queries';
import { requirePermission } from '../../../../features/rbac/middleware';
import { handleApiError } from '../../../../lib/apiError';

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'players:read');

    const playerId = params.id;
    if (!playerId) {
      return new Response(JSON.stringify({ error: 'Player ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const history = await getPlayerTeamHistory(playerId);

    return new Response(JSON.stringify(history), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'fetch player team history', request);
  }
};
