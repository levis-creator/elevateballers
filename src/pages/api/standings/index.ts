import type { APIRoute } from 'astro';
import { handleApiError } from '../../../lib/apiError';
import { getStandings } from '../../../features/standings/lib/getStandings';
/**
 * GET /api/standings
 * Fetches team standings for a league/season
 * Query params:
 *   - leagueId (optional): Filter by league
 *   - seasonId (optional): Filter by season
 */
export const GET: APIRoute = async ({ request }) => {
    try {
        const url = new URL(request.url);
        const leagueId = url.searchParams.get('leagueId');
        const seasonId = url.searchParams.get('seasonId');
        const rankedStandings = await getStandings({
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
