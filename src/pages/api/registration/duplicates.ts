import type { APIRoute } from 'astro';
import { requireAnyPermission } from '../../../features/rbac/middleware';
import { logAudit } from '../../../features/cms/lib/audit';
import { handleApiError } from '../../../lib/apiError';
import { prisma } from '../../../lib/prisma';

export const prerender = false;

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const reviewer = await requireAnyPermission(request, ['players:update', 'teams:update']);
    const body = await request.json();
    const matchKey = typeof body.matchKey === 'string' ? body.matchKey.trim() : '';
    const resolution = body.resolution;

    if (!matchKey || !['NOT_DUPLICATE', 'FLAG_FOR_MERGE'].includes(resolution)) {
      return json({ error: 'matchKey and a valid resolution are required' }, 400);
    }

    const review = await (prisma as any).playerDuplicateReview.upsert({
      where: { matchKey },
      create: { matchKey, resolution, reviewedById: reviewer.id, reviewedAt: new Date() },
      update: { resolution, reviewedById: reviewer.id, reviewedAt: new Date() },
    });

    await logAudit(request, 'PLAYER_DUPLICATE_REVIEWED', { matchKey, resolution, reviewId: review.id });
    return json(review);
  } catch (error) {
    return handleApiError(error, 'review player duplicate warning', request);
  }
};
