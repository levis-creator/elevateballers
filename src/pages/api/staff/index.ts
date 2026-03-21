import type { APIRoute } from 'astro';
import { getStaff } from '../../../features/cms/lib/queries';
import { createStaff } from '../../../features/cms/lib/mutations';
import { requirePermission } from '../../../features/rbac/middleware';
import { logAudit } from '../../../features/cms/lib/audit';

import { handleApiError } from '../../../lib/apiError';
export const prerender = false;
import { prisma } from '../../../lib/prisma';

export const GET: APIRoute = async ({ request }) => {
  try {
    const staff = await getStaff();

    return new Response(JSON.stringify(staff), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    return handleApiError(error, "fetch staff");
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    await requirePermission(request, 'staff:create');
    const data = await request.json();

    // Validate required fields
    if (!data.firstName || !data.lastName || !data.role) {
      return new Response(JSON.stringify({ error: 'First name, last name, and role are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const staff = await createStaff({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      role: data.role,
      bio: data.bio,
      image: data.image,
    });

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
