import type { APIRoute } from 'astro';
import { requirePermission } from '../../../features/rbac/middleware';
import { prisma } from '../../../lib/prisma';
import { logAudit } from '../../../features/cms/lib/audit';
import { handleApiError } from '../../../lib/apiError';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    await requirePermission(request, 'teams:bulk_delete');
    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return new Response(JSON.stringify({ error: 'IDs array is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await prisma.team.deleteMany({
      where: { id: { in: ids } },
    });

    await logAudit(request, 'TEAM_BULK_DELETED', {
      teamIds: ids,
      deleted: result.count,
    });

    return new Response(JSON.stringify({ deleted: result.count }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error bulk deleting teams:', error);
    return handleApiError(error, 'delete teams', request);
  }
};
