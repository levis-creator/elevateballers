import type { APIRoute } from 'astro';
import { requirePermission } from '../../../features/rbac/middleware';
import { prisma } from '../../../lib/prisma';
import { logAudit } from '../../../features/cms/lib/audit';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    await requirePermission(request, 'seasons:delete');
    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return new Response(JSON.stringify({ error: 'IDs array is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await prisma.season.deleteMany({
      where: { id: { in: ids } },
    });

    await logAudit(request, 'SEASON_BULK_DELETED', {
      seasonIds: ids,
      deleted: result.count,
    });

    return new Response(JSON.stringify({ deleted: result.count }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error bulk deleting seasons:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to delete seasons' }),
      {
        status: error.message === 'Unauthorized' || error.message.includes('Forbidden') ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
