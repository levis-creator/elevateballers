import type { APIRoute } from 'astro';
import { handleApiError } from '../../../lib/apiError';
import { getStandings } from '../../../features/standings/lib/getStandings';
/**
 * GET /api/standings
 * Fetches standings for one competition edition.
 * Query params:
 *   - leagueSeasonId: competition edition
 *   - conferenceId (optional): one conference in a CONFERENCES competition
 */
export const GET: APIRoute = async ({ request }) => {
    try {
        const url = new URL(request.url);
        const leagueId = url.searchParams.get('leagueId');
        const seasonId = url.searchParams.get('seasonId');
        const leagueSeasonId = url.searchParams.get('leagueSeasonId');
        const conferenceId = url.searchParams.get('conferenceId');
        if (!leagueSeasonId && !(leagueId && seasonId)) {
            return new Response(JSON.stringify({ error: 'leagueSeasonId is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        const rankedStandings = await getStandings({
            leagueSeasonId: leagueSeasonId || undefined,
            conferenceId: conferenceId || undefined,
            leagueId: leagueId || undefined,
            seasonId: seasonId || undefined,
        });

        return new Response(JSON.stringify(rankedStandings), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        console.error('Error fetching standings:', error);
        return handleApiError(error, "fetch standings");
    }
};
