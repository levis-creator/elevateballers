import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';
import { deleteStaff, getStaff, updateStaff } from '@/features/staff/application/usecases/staff-management';
import { requirePermission } from '../../../features/rbac/middleware';
import { requireSystemAdmin } from '@/features/rbac/auth-helpers';
import { logAudit } from '../../../features/cms/lib/audit';

import { handleApiError } from '../../../lib/apiError';
export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  try {
    // This response includes internal notes, compliance fields and account
    // linkage; it must never be a public staff profile endpoint.
    await requirePermission(request, 'staff:read');
    const staff = await getStaff(params.id!);

    if (!staff) {
      return new Response(JSON.stringify({ error: 'Staff not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const lastEdit = await prisma.userAuditLog.findFirst({ where: { action: 'STAFF_UPDATED', metadata: { path: 'staffId', equals: params.id! } }, orderBy: { createdAt: 'desc' }, select: { performedBy: true } });
    const editor = lastEdit ? await prisma.user.findUnique({ where: { id: lastEdit.performedBy }, select: { name: true } }) : null;
    return new Response(JSON.stringify({ ...staff, lastEditedBy: editor?.name ?? null }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'fetch staff');
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const data = await request.json();
    if (data.assignments !== undefined) await requireSystemAdmin(request);
    else await requirePermission(request, 'staff:update');
    const staff = await updateStaff(params.id!, data);

    if (!staff) {
      return new Response(JSON.stringify({ error: 'Staff not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await logAudit(request, 'STAFF_UPDATED', { staffId: params.id });
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
