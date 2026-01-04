import type { APIRoute } from 'astro';
import { getStaffById } from '../../../features/cms/lib/queries';
import { updateStaff, deleteStaff } from '../../../features/cms/lib/mutations';
import { requireAdmin } from '../../../features/cms/lib/auth';

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
    console.error('Error fetching staff:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch staff' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    await requireAdmin(request);
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
  } catch (error: any) {
    console.error('Error updating staff:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to update staff' }),
      {
        status: error.message === 'Unauthorized' || error.message.includes('Forbidden') ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    await requireAdmin(request);
    const success = await deleteStaff(params.id!);

    if (!success) {
      return new Response(JSON.stringify({ error: 'Failed to delete staff' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(null, { status: 204 });
  } catch (error: any) {
    console.error('Error deleting staff:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to delete staff' }),
      {
        status: error.message === 'Unauthorized' || error.message.includes('Forbidden') ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

