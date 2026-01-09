import type { APIRoute } from 'astro';
import { requireAdmin } from '../../../features/cms/lib/auth';
import { prisma } from '../../../lib/prisma';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    await requireAdmin(request);
    const { ids, approved } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return new Response(JSON.stringify({ error: 'IDs array is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await prisma.team.updateMany({
      where: { id: { in: ids } },
      data: { approved: approved !== undefined ? approved : true },
    });

    return new Response(JSON.stringify({ updated: result.count }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error bulk approving teams:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to approve teams' }),
      {
        status: error.message === 'Unauthorized' || error.message.includes('Forbidden') ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
