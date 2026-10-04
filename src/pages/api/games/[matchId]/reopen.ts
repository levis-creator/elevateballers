import type { APIRoute } from 'astro';
import { requireMatchScopedPermission } from '@/features/rbac/middleware';
import { logAudit } from '@/features/cms/lib/audit';
import { prisma } from '@/lib/prisma';
import { json, handleApiError } from '@/lib/apiError';
import { cacheDel, cacheInvalidatePattern } from '@/lib/cache';
import { publishToJob } from '@/lib/qstash';
import { standingsCachePattern } from '@/features/standings/lib/standings-cache';

export const prerender = false;

/**
 * POST /api/games/[matchId]/reopen
 * Put a completed match back to LIVE so the scorer can correct events.
 * A published result is unpublished and standings recalculated; ending the
 * game again re-publishes per the auto-publish setting. Refused once a
 * bracket match the result fed into has started.
 */
export const POST: APIRoute = async ({ params, request }) => {
  try {
    const matchId = params.matchId;
    if (!matchId) return json({ error: 'Match ID is required' }, 400);
    await requireMatchScopedPermission(request, matchId, 'matches:update');

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: {
        status: true,
        leagueSeasonId: true,
        resultPublishedAt: true,
        nextWinnerMatchId: true,
        nextLoserMatchId: true,
      },
    });
    if (!match) return json({ error: 'Match not found' }, 404);
    if (match.status !== 'COMPLETED') {
      return json({ error: 'Only completed matches can be reopened' }, 409);
    }

    const nextIds = [match.nextWinnerMatchId, match.nextLoserMatchId].filter((id): id is string => !!id);
    if (nextIds.length) {
      const started = await prisma.match.count({ where: { id: { in: nextIds }, status: { not: 'UPCOMING' } } });
      if (started > 0) {
        return json({ error: 'The next bracket match has already started — this result can’t be reopened' }, 409);
      }
    }

    const wasPublished = !!match.resultPublishedAt;
    await prisma.match.update({
      where: { id: matchId },
      data: { status: 'LIVE', resultPublishedAt: null, clockRunning: false, clockStartedAt: null, clockSecondsAtStart: null },
    });

    await Promise.all([
      cacheDel(`gamestate:${matchId}`),
      cacheInvalidatePattern('leaders:*'),
      ...(match.leagueSeasonId ? [cacheInvalidatePattern(standingsCachePattern(match.leagueSeasonId))] : []),
    ]);
    if (wasPublished && match.leagueSeasonId) {
      await publishToJob('/api/jobs/recalc-standings', { leagueSeasonId: match.leagueSeasonId });
    }

    await logAudit(request, 'MATCH_REOPENED', { matchId, wasPublished });
    return json({ reopened: true, wasPublished }, 200);
  } catch (error) {
    return handleApiError(error, 'reopen match', request);
  }
};
