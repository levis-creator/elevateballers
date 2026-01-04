import type { APIRoute } from 'astro';
import { getStaff } from '../../../features/cms/lib/queries';
import { createStaff } from '../../../features/cms/lib/mutations';
import { requireAdmin } from '../../../features/cms/lib/auth';

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
    return new Response(JSON.stringify({ error: 'Failed to fetch staff' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    await requireAdmin(request);
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

    return new Response(JSON.stringify(staff), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error creating staff:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to create staff' }),
      {
        status: error.message === 'Unauthorized' || error.message.includes('Forbidden') ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

