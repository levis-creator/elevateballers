import type { APIRoute } from 'astro';
import { requirePermission } from '../../../features/rbac/middleware';
import { bulkDeleteStaff } from '@/features/staff/application/usecases/staff-management';
import { logAudit } from '../../../features/cms/lib/audit';
import { handleApiError } from '../../../lib/apiError';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    await requirePermission(request, 'staff:bulk_delete');
    const body = await request.json();
    const result = await bulkDeleteStaff(body);

    await logAudit(request, 'STAFF_BULK_DELETED', {
      staffIds: body.ids,
      deleted: result.count,
    });

    return new Response(JSON.stringify({ deleted: result.count }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error bulk deleting staff:', error);
    return handleApiError(error, 'delete staff', request);
  }
};
