import type { APIRoute } from 'astro';
import { startGame } from '../../../../features/game-tracking/lib/mutations';
import { getGameState } from '../../../../features/game-tracking/lib/queries';
import { requireAuth } from '../../../../features/cms/lib/auth';
import { logAudit } from '../../../../features/cms/lib/audit';
import { prisma } from '../../../../lib/prisma';

import { handleApiError } from '../../../../lib/apiError';
export const prerender = false;

/**
 * POST /api/games/[matchId]/start
 * Start a game (initialize game state)
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

    const body = await request.json().catch(() => ({}));
    const gameRulesId = body.gameRulesId;

    // Starting play-by-play resets the score to 0-0, so a typed-in result is
    // only replaced when the caller confirms it.
    const existing = await prisma.match.findUnique({
      where: { id: matchId },
      select: { scoreSource: true, team1Score: true, team2Score: true },
    });
    if (existing?.scoreSource === 'MANUAL' && !body.replaceManualScore) {
      return new Response(
        JSON.stringify({
          error: `This match has a manually entered score (${existing.team1Score ?? 0}–${existing.team2Score ?? 0}). Confirm to replace it with play-by-play.`,
          code: 'MANUAL_SCORE',
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const success = await startGame(matchId, gameRulesId);

    if (!success) {
      return new Response(JSON.stringify({ error: 'Failed to start game' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const state = await getGameState(matchId);
    await logAudit(request, 'GAME_STARTED', {
      matchId,
      gameRulesId,
      ...(existing?.scoreSource === 'MANUAL' && {
        replacedManualScore: { team1Score: existing.team1Score, team2Score: existing.team2Score },
      }),
    });
    return new Response(JSON.stringify(state), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error starting game:', error);
    return handleApiError(error, "start game", request);
  }
};
