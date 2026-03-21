import type { APIRoute } from 'astro';
import { getStaffById } from '../../../features/cms/lib/queries';
import { updateStaff, deleteStaff } from '../../../features/cms/lib/mutations';
import { requirePermission } from '../../../features/rbac/middleware';
import { logAudit } from '../../../features/cms/lib/audit';

import { handleApiError } from '../../../lib/apiError';
export const prerender = false;
import { prisma } from '../../../lib/prisma';

export const GET: APIRoute = async ({ params }) => {
  try {
    const staff = await getStaffById(params.id!);

    if (!staff) {
      return new Response(JSON.stringify({ error: 'Staff not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(staff), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'fetch staff');
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'staff:update');
    const data = await request.json();

    const staff = await updateStaff(params.id!, data);

    if (!staff) {
      return new Response(JSON.stringify({ error: 'Staff not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(staff), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'update staff', request);
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'staff:update');
    const success = await deleteStaff(params.id!);

    if (!success) {
      return new Response(JSON.stringify({ error: 'Staff not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await logAudit(request, 'STAFF_DELETED', {
      staffId: params.id,
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error, 'delete staff', request);
  }
};
