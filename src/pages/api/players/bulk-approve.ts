import type { APIRoute } from 'astro';
import { requirePermission } from '../../../features/rbac/middleware';
import { prisma } from '../../../lib/prisma';
import { logAudit } from '../../../features/cms/lib/audit';

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
  } catch (error: any) {
    console.error('Error bulk approving players:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to approve players' }),
      {
        status: error.message === 'Unauthorized' || error.message.includes('Forbidden') ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
