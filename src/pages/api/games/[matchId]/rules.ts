import type { APIRoute } from 'astro';
import { getMatchWithGameState } from '../../../../features/game-tracking/lib/queries';
import { siteSettingsService, resolvePublicMatchPageSettings } from '../../../../features/settings';

import { handleApiError } from '../../../../lib/apiError';
export const prerender = false;

/**
 * GET /api/games/[matchId]/rules
 * Get game rules for a match, plus the console options that come from site
 * settings (askShotLocation).
 */
export const GET: APIRoute = async ({ params, request }) => {
  try {
    const matchId = params.matchId;
    if (!matchId) {
      return new Response(JSON.stringify({ error: 'Match ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const [match, matchSettings] = await Promise.all([
      getMatchWithGameState(matchId),
      siteSettingsService.list('match').catch(() => []),
    ]);

    if (!match) {
      return new Response(JSON.stringify({ error: 'Match not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const askShotLocation = resolvePublicMatchPageSettings(matchSettings).shotLocations;
    return new Response(JSON.stringify({ ...(match.gameRules ?? {}), askShotLocation }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error fetching game rules:', error);
    return handleApiError(error, "fetch game rules", request);
  }
};
