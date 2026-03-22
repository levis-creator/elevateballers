import type { APIRoute } from 'astro';
import { requirePermission } from '../../../features/rbac/domain/usecases/middleware';
import { prisma } from '../../../lib/prisma';
import { logAudit } from '../../../features/audit/lib/audit';
import { handleApiError } from '../../../lib/apiError';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    await requirePermission(request, 'staff:bulk_delete');
    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return new Response(JSON.stringify({ error: 'IDs array is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await prisma.staff.deleteMany({
      where: { id: { in: ids } },
    });

    await logAudit(request, 'STAFF_BULK_DELETED', {
      staffIds: ids,
      deleted: result.count,
    });

    return new Response(JSON.stringify({ deleted: result.count }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error bulk deleting staff:', error);
    return handleApiError(error, 'delete staff', request);
  }
};
