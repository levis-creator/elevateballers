import type { APIRoute } from 'astro';
import { requirePermission } from '../../../../features/rbac/middleware';
import { prisma } from '../../../../lib/prisma';
import { logAudit } from '../../../../features/cms/lib/audit';

export const prerender = false;

export const PATCH: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'players:approve');
    const { id } = params;
    const data = await request.json();

    if (!id) {
      return new Response(JSON.stringify({ error: 'Player ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const player = await prisma.player.update({
      where: { id },
      data: {
        approved: data.approved ?? true,
      },
    });

    await logAudit(request, (data.approved ?? true) ? 'PLAYER_APPROVED' : 'PLAYER_UNAPPROVED', {
      playerId: id,
    });

    return new Response(JSON.stringify(player), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error approving player:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to approve player' }),
      {
        status: error.message === 'Unauthorized' || error.message === 'Forbidden: Admin access required' ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
