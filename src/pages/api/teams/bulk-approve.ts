import type { APIRoute } from 'astro';
import { requirePermission } from '../../../features/rbac/domain/usecases/middleware';
import { prisma } from '../../../lib/prisma';
import { logAudit } from '../../../features/audit/lib/audit';
import { handleApiError } from '../../../lib/apiError';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    await requirePermission(request, 'teams:bulk_approve');
    const { ids, approved } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return new Response(JSON.stringify({ error: 'IDs array is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const shouldApprove = approved !== undefined ? approved : true;

    const result = await prisma.team.updateMany({
      where: { id: { in: ids } },
      data: { approved: shouldApprove },
    });

    if (shouldApprove) {
      await prisma.staff.updateMany({
        where: {
          teams: {
            some: { teamId: { in: ids } },
          },
        },
        data: {
          approved: true,
        },
      });
    }

    await logAudit(request, shouldApprove ? 'TEAM_BULK_APPROVED' : 'TEAM_BULK_UNAPPROVED', {
      teamIds: ids,
      updated: result.count,
    });

    return new Response(JSON.stringify({ updated: result.count }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error bulk approving teams:', error);
    return handleApiError(error, 'approve teams', request);
  }
};
