import type { APIRoute } from 'astro';
import { requirePermission } from '../../../../features/rbac/middleware';
import { prisma } from '../../../../lib/prisma';
import { logAudit } from '../../../../features/cms/lib/audit';
import { handleApiError } from '../../../../lib/apiError';
import { notifyPlayerRegistrationDecision } from '../../../../features/registration/application/send-registration-decision';

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

    const shouldApprove = data.approved ?? true;

    const previous = await prisma.player.findUnique({ where: { id }, select: { approved: true } });

    const player = await prisma.player.update({
      where: { id },
      data: {
        approved: shouldApprove,
      },
    });

    if (previous && previous.approved !== shouldApprove) {
      void notifyPlayerRegistrationDecision(id, shouldApprove)
        .catch((err) => console.error('[email] Failed to send player decision email:', err));
    }

    await logAudit(request, shouldApprove ? 'PLAYER_APPROVED' : 'PLAYER_UNAPPROVED', {
      playerId: id,
    });

    return new Response(JSON.stringify(player), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'approve player', request);
  }
};
