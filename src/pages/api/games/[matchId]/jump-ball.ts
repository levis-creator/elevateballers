import type { APIRoute } from 'astro';
import { createJumpBall } from '../../../../features/game-tracking/lib/mutations';
import { getMatchJumpBalls, getPeriodJumpBalls } from '../../../../features/game-tracking/lib/queries';
import { requireAuth } from '../../../../features/cms/lib/auth';

export const prerender = false;

/**
 * GET /api/games/[matchId]/jump-ball
 * Get jump balls for a match
 * Query parameters:
 * - period: Filter by period number
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

    const url = new URL(request.url);
    const periodParam = url.searchParams.get('period');

    let jumpBalls;
    if (periodParam) {
      const period = parseInt(periodParam, 10);
      if (isNaN(period)) {
        return new Response(JSON.stringify({ error: 'Invalid period number' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      jumpBalls = await getPeriodJumpBalls(matchId, period);
    } else {
      jumpBalls = await getMatchJumpBalls(matchId);
    }

    return new Response(JSON.stringify(jumpBalls), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error fetching jump balls:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch jump balls' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * POST /api/games/[matchId]/jump-ball
 * Record a jump ball
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
    const { period, player1Id, player2Id, possessionTeamId, secondsRemaining } = body;

    if (!period || !player1Id || !player2Id) {
      return new Response(
        JSON.stringify({ error: 'Period, player1Id, and player2Id are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const jumpBall = await createJumpBall({
      matchId,
      period: parseInt(period, 10),
      player1Id,
      player2Id,
      possessionTeamId: possessionTeamId || null,
      secondsRemaining: secondsRemaining ? parseInt(secondsRemaining, 10) : null,
    });

    if (!jumpBall) {
      return new Response(JSON.stringify({ error: 'Failed to create jump ball' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(jumpBall), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error creating jump ball:', error);
    return new Response(JSON.stringify({ error: 'Failed to create jump ball' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
