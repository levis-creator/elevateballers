import type { APIRoute } from 'astro';
import { requirePermission } from '../../../features/rbac/middleware';
import { prisma } from '../../../lib/prisma';
import { logAudit } from '../../../features/cms/lib/audit';
import { handleApiError } from '../../../lib/apiError';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    await requirePermission(request, 'players:bulk_approve');
    const { ids, approved } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return new Response(JSON.stringify({ error: 'IDs array is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await prisma.player.updateMany({
      where: { id: { in: ids } },
      data: { approved: approved !== undefined ? approved : true },
    });

    await logAudit(request, (approved !== undefined ? approved : true) ? 'PLAYER_BULK_APPROVED' : 'PLAYER_BULK_UNAPPROVED', {
      playerIds: ids,
      updated: result.count,
    });

    return new Response(JSON.stringify({ updated: result.count }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'bulk approve players', request);
  }
};
