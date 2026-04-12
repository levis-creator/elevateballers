import type { APIRoute } from 'astro';
import { createSubstitution } from '../../../../features/game-tracking/lib/mutations';
import { getMatchSubstitutions } from '../../../../features/game-tracking/lib/queries';
import { requireAuth } from '../../../../features/cms/lib/auth';
import { logAudit } from '../../../../features/cms/lib/audit';

import { handleApiError } from '../../../../lib/apiError';
export const prerender = false;

/**
 * POST /api/games/[matchId]/substitution
 * Record a substitution
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
    const { teamId, playerInId, playerOutId, period, secondsRemaining } = body;

    if (!teamId || !playerInId || !playerOutId || !period) {
      return new Response(
        JSON.stringify({ error: 'teamId, playerInId, playerOutId, and quarter are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const substitution = await createSubstitution({
      matchId,
      teamId,
      playerInId,
      playerOutId,
      period: parseInt(period),
      secondsRemaining: secondsRemaining ? parseInt(secondsRemaining) : null,
    });

    if (!substitution) {
      return new Response(JSON.stringify({ error: 'Failed to create substitution' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await logAudit(request, 'GAME_SUBSTITUTION_RECORDED', {
      matchId,
      substitutionId: substitution.id,
      teamId: substitution.teamId,
      playerInId: substitution.playerInId,
      playerOutId: substitution.playerOutId,
      period: substitution.period,
    });

    const substitutions = await getMatchSubstitutions(matchId);
    return new Response(JSON.stringify({ substitution, substitutions }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error creating substitution:', error);
    return handleApiError(error, "create substitution");
  }
};

/**
 * GET /api/games/[matchId]/substitution
 * Get all substitutions for a match
 */
export const GET: APIRoute = async ({ params }) => {
  try {
    const matchId = params.matchId;
    if (!matchId) {
      return new Response(JSON.stringify({ error: 'Match ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const substitutions = await getMatchSubstitutions(matchId);

    return new Response(JSON.stringify(substitutions), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error fetching substitutions:', error);
    return handleApiError(error, "fetch substitutions");
  }
};
