import type { APIRoute } from 'astro';
import { createTimeout } from '../../../../features/game-tracking/lib/mutations';
import { getMatchTimeouts, getFilteredTimeouts } from '../../../../features/game-tracking/lib/queries';
import { requireAuth } from '../../../../features/cms/lib/auth';
import type { TimeoutType } from '@prisma/client';

export const prerender = false;

/**
 * GET /api/games/[matchId]/timeout
 * Get timeouts for a match with optional filtering
 * 
 * Query parameters:
 * - period: Filter by period number
 * - teamId: Filter by team ID
 * - timeoutType: Filter by timeout type (SIXTY_SECOND, THIRTY_SECOND)
 * - limit: Limit number of results
 */
export const GET: APIRoute = async ({ params, request }) => {
  try {
    await requireAuth(request);
  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const matchId = params.matchId;
    if (!matchId) {
      return new Response(JSON.stringify({ error: 'Match ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const periodParam = url.searchParams.get('period');
    const teamIdParam = url.searchParams.get('teamId');
    const timeoutTypeParam = url.searchParams.get('timeoutType');
    const limitParam = url.searchParams.get('limit');

    // Build filters
    const filters: {
      period?: number;
      teamId?: string;
      timeoutType?: 'SIXTY_SECOND' | 'THIRTY_SECOND';
    } = {};

    if (periodParam) {
      const period = parseInt(periodParam, 10);
      if (!isNaN(period)) {
        filters.period = period;
      }
    }

    if (teamIdParam) {
      filters.teamId = teamIdParam;
    }

    if (timeoutTypeParam && ['SIXTY_SECOND', 'THIRTY_SECOND'].includes(timeoutTypeParam)) {
      filters.timeoutType = timeoutTypeParam as 'SIXTY_SECOND' | 'THIRTY_SECOND';
    }

    // Get filtered timeouts
    let timeouts = await getFilteredTimeouts(matchId, Object.keys(filters).length > 0 ? filters : undefined);

    // Apply limit if specified
    if (limitParam) {
      const limit = parseInt(limitParam, 10);
      if (!isNaN(limit) && limit > 0) {
        timeouts = timeouts.slice(0, limit);
      }
    }

    return new Response(JSON.stringify(timeouts), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error fetching timeouts:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch timeouts' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * POST /api/games/[matchId]/timeout
 * Record a timeout
 */
export const POST: APIRoute = async ({ params, request }) => {
  try {
    await requireAuth(request);
  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const matchId = params.matchId;
    if (!matchId) {
      return new Response(JSON.stringify({ error: 'Match ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { teamId, period, timeoutType, secondsRemaining } = body;

    if (!teamId || !period || !timeoutType) {
      return new Response(
        JSON.stringify({ error: 'teamId, period, and timeoutType are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const timeout = await createTimeout({
      matchId,
      teamId,
      period: parseInt(period),
      timeoutType: timeoutType as TimeoutType,
      secondsRemaining: secondsRemaining ? parseInt(secondsRemaining) : null,
    });

    if (!timeout) {
      return new Response(JSON.stringify({ error: 'Failed to create timeout' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const timeouts = await getMatchTimeouts(matchId);
    return new Response(JSON.stringify({ timeout, timeouts }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error creating timeout:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to create timeout' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
