import type { APIRoute } from 'astro';
import { requireAdmin } from '../../../../features/cms/lib/auth';
import { prisma } from '../../../../lib/prisma';

export const prerender = false;

export const PATCH: APIRoute = async ({ params, request }) => {
  try {
    await requireAdmin(request);
    const { id } = params;
    const data = await request.json();

    if (!id) {
      return new Response(JSON.stringify({ error: 'Team ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const team = await prisma.team.update({
      where: { id },
      data: {
        approved: data.approved ?? true,
      },
    });

    return new Response(JSON.stringify(team), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error approving team:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to approve team' }),
      {
        status: error.message === 'Unauthorized' || error.message === 'Forbidden: Admin access required' ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

