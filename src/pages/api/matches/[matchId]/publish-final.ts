import type { APIRoute } from 'astro';
import { requireMatchScopedPermission } from '@/features/rbac/middleware';
import { logAudit } from '@/features/cms/lib/audit';
import { prisma } from '@/lib/prisma';
import { json, handleApiError } from '@/lib/apiError';
import { cacheDel, cacheInvalidatePattern } from '@/lib/cache';
import { standingsCachePattern } from '@/features/standings/lib/standings-cache';

export const prerender = false;

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const matchId = params.matchId;
    if (!matchId) return json({ error: 'Match ID is required' }, 400);
    await requireMatchScopedPermission(request, matchId, 'matches:update');

    const existing = await prisma.match.findUnique({
      where: { id: matchId },
      select: { status: true, leagueSeasonId: true },
    });
    if (!existing) return json({ error: 'Match not found' }, 404);
    if (existing.status !== 'COMPLETED') {
      return json({ error: 'Only completed matches can publish a final result' }, 409);
    }

    const publishedAt = new Date();
    await prisma.match.update({ where: { id: matchId }, data: { resultPublishedAt: publishedAt } });
    await Promise.all([
      cacheDel(`gamestate:${matchId}`),
      cacheInvalidatePattern('leaders:*'),
      ...(existing.leagueSeasonId
        ? [cacheInvalidatePattern(standingsCachePattern(existing.leagueSeasonId))]
        : []),
    ]);
    await logAudit(request, 'MATCH_FINAL_PUBLISHED', { matchId, publishedAt });

    return json({ published: true, publishedAt }, 200);
  } catch (error) {
    return handleApiError(error, 'publish match final', request);
  }
};
