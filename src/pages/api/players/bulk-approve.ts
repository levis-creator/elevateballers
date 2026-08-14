import type { APIRoute } from 'astro';
import { requirePermission } from '../../../features/rbac/middleware';
import { prisma } from '../../../lib/prisma';
import { logAudit } from '../../../features/cms/lib/audit';
import { handleApiError } from '../../../lib/apiError';
import { notifyPlayerRegistrationDecision } from '../../../features/registration/application/send-registration-decision';

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

    const shouldApprove = approved !== undefined ? approved : true;
    const changed = await prisma.player.findMany({
      where: { id: { in: ids }, approved: { not: shouldApprove } },
      select: { id: true },
    });
    const result = await prisma.player.updateMany({
      where: { id: { in: ids } },
      data: { approved: shouldApprove },
    });

    void Promise.allSettled(changed.map((player) => notifyPlayerRegistrationDecision(player.id, shouldApprove)))
      .then((settled) => {
        for (const item of settled) if (item.status === 'rejected') console.error('[email] Bulk player decision email failed:', item.reason);
      });

    await logAudit(request, shouldApprove ? 'PLAYER_BULK_APPROVED' : 'PLAYER_BULK_UNAPPROVED', {
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
