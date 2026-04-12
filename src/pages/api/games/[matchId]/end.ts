import type { APIRoute } from 'astro';
import { endGame } from '../../../../features/game-tracking/lib/mutations';
import { getGameState } from '../../../../features/game-tracking/lib/queries';
import { requireAuth } from '../../../../features/cms/lib/auth';
import { logAudit } from '../../../../features/cms/lib/audit';

import { handleApiError } from '../../../../lib/apiError';
import { cacheDel, cacheInvalidatePattern } from '../../../../lib/cache';
import { publishToJob } from '../../../../lib/qstash';
import { prisma } from '../../../../lib/prisma';
export const prerender = false;

/**
 * POST /api/games/[matchId]/end
 * End a game (set match status to COMPLETED)
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

    const success = await endGame(matchId);

    if (!success) {
      return new Response(JSON.stringify({ error: 'Failed to end game' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Invalidate caches that depend on match results
    await Promise.all([
      cacheDel(`gamestate:${matchId}`),
      cacheInvalidatePattern('standings:*'),
      cacheInvalidatePattern('leaders:*'),
    ]);

    // Queue background standings recalculation via QStash
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { leagueId: true, seasonId: true },
    });
    if (match) {
      await publishToJob('/api/jobs/recalc-standings', {
        leagueId: match.leagueId,
        seasonId: match.seasonId,
      });
    }

    const state = await getGameState(matchId);
    await logAudit(request, 'GAME_ENDED', { matchId });
    return new Response(JSON.stringify(state), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error ending game:', error);
    return handleApiError(error, "end game");
  }
};
