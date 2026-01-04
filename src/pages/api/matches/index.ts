import type { APIRoute } from 'astro';
import { getFilteredMatches } from '../../../features/matches/lib/queries';
import { createMatch } from '../../../features/cms/lib/mutations';
import { requireAdmin } from '../../../features/cms/lib/auth';
import type { MatchFilter, MatchSortOption, MatchDTO, MatchStage } from '../../../features/matches/types';

export const prerender = false;

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};

/**
 * GET /api/matches - Public endpoint to fetch matches with filtering
 * 
 * Query parameters:
 * - status: Filter by match status (UPCOMING, LIVE, COMPLETED)
 * - stage: Filter by match stage (REGULAR_SEASON, PLAYOFF, CHAMPIONSHIP, etc.)
 * - league: Filter by league name or slug
 * - leagueId: Filter by league ID
 * - dateFrom: Filter matches from this date (ISO format)
 * - dateTo: Filter matches until this date (ISO format)
 * - search: Search in team names or league
 * - sort: Sort order (date-asc, date-desc, league-asc, league-desc)
 * - limit: Limit number of results
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    
    // Build filter object
    const filter: MatchFilter = {};
    
    // Status filter
    const statusParam = url.searchParams.get('status');
    if (statusParam) {
      const statusUpper = statusParam.toUpperCase();
      if (['UPCOMING', 'LIVE', 'COMPLETED'].includes(statusUpper)) {
        filter.status = statusUpper as 'UPCOMING' | 'LIVE' | 'COMPLETED';
      }
    }
    
    // Stage filter
    const stageParam = url.searchParams.get('stage');
    if (stageParam) {
      // Convert "semi-finals" or "SEMI_FINALS" to MatchStage enum
      const stageNormalized = stageParam.toUpperCase().replace(/-/g, '_');
      const validStages: MatchStage[] = [
        'REGULAR_SEASON',
        'PRESEASON',
        'EXHIBITION',
        'PLAYOFF',
        'QUARTER_FINALS',
        'SEMI_FINALS',
        'CHAMPIONSHIP',
        'QUALIFIER',
        'OTHER',
      ];
      if (validStages.includes(stageNormalized as MatchStage)) {
        filter.stage = stageNormalized as MatchStage;
      }
    }
    
    // League filter - check both league and leagueId
    const leagueParam = url.searchParams.get('league');
    const leagueIdParam = url.searchParams.get('leagueId');
    
    if (leagueIdParam) {
      // If leagueId is provided, use getMatchesByLeague with the ID
      // But first, let's handle it in the filter
      filter.leagueId = leagueIdParam;
    } else if (leagueParam) {
      // Use league name/slug filter
      filter.league = leagueParam;
    }
    
    // Date range filters
    const dateFromParam = url.searchParams.get('dateFrom');
    const dateToParam = url.searchParams.get('dateTo');
    
    if (dateFromParam) {
      filter.dateFrom = new Date(dateFromParam);
    }
    if (dateToParam) {
      filter.dateTo = new Date(dateToParam);
    }
    
    // Search filter
    const searchParam = url.searchParams.get('search');
    if (searchParam) {
      filter.search = searchParam;
    }
    
    // Sort option
    const sortParam = url.searchParams.get('sort') || 'date-asc';
    const sort: MatchSortOption = ['date-asc', 'date-desc', 'league-asc', 'league-desc'].includes(sortParam)
      ? (sortParam as MatchSortOption)
      : 'date-asc';
    
    // Limit
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    
    // Get filtered matches
    const matches: MatchDTO[] = await getFilteredMatches(filter, sort, limit);

    return new Response(JSON.stringify(matches), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch matches' }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    await requireAdmin(request);
    const data = await request.json();

    // Validate required fields
    if ((!data.team1Id && !data.team1Name) || (!data.team2Id && !data.team2Name) || !data.date || (!data.leagueId && !data.league)) {
      return new Response(
        JSON.stringify({ error: 'Teams, date, and league are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const match = await createMatch({
      team1Id: data.team1Id,
      team1Name: data.team1Name,
      team1Logo: data.team1Logo || '',
      team2Id: data.team2Id,
      team2Name: data.team2Name,
      team2Logo: data.team2Logo || '',
      leagueId: data.leagueId,
      league: data.league,
      date: new Date(data.date),
      team1Score: data.team1Score,
      team2Score: data.team2Score,
      status: data.status || 'UPCOMING',
      // Only pass stage if it's a valid value (not empty string or __none placeholder)
      stage: data.stage && data.stage !== '__none' && data.stage.trim() !== '' ? data.stage : undefined,
    });

    return new Response(JSON.stringify(match), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error creating match:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to create match' }),
      {
        status: error.message === 'Unauthorized' || error.message.includes('Forbidden') ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

