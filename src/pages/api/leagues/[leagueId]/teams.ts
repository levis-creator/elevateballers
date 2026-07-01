import type { APIRoute } from 'astro';
import { getLeagueTeams } from '../../../../features/cms/lib/queries';
import { handleApiError } from '../../../../lib/apiError';

export const prerender = false;

/**
 * GET /api/leagues/[leagueId]/teams — teams in the league, derived as the union
 * of participants across all of the league's seasons.
 */
export const GET: APIRoute = async ({ params }) => {
  try {
    const teams = await getLeagueTeams(params.leagueId!);
    return new Response(JSON.stringify(teams), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'fetch league teams');
  }
};
