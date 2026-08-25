import type { APIRoute } from 'astro';
import { createStaff, listStaff } from '@/features/staff/application/usecases/staff-management';
import { requirePermission } from '../../../features/rbac/middleware';
import { requireSystemAdmin } from '@/features/rbac/auth-helpers';
import { logAudit } from '../../../features/cms/lib/audit';

import { handleApiError } from '../../../lib/apiError';
export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    await requirePermission(request, 'staff:read');
    const staff = await listStaff();

    return new Response(JSON.stringify(staff), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    return handleApiError(error, "fetch staff");
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    await requireSystemAdmin(request);
    const staff = await createStaff(await request.json());

    await logAudit(request, 'STAFF_CREATED', {
      staffId: staff.id,
      name: `${staff.firstName} ${staff.lastName}`.trim(),
      role: staff.role,
    });

    return new Response(JSON.stringify(staff), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'create staff', request);
  }
};
