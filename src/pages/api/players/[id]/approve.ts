import type { APIRoute } from 'astro';
import { requirePermission } from '../../../../features/rbac/middleware';
import { prisma } from '../../../../lib/prisma';
import { logAudit } from '../../../../features/cms/lib/audit';
import { sendPlayerApprovedEmail } from '../../../../lib/email';

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

    const player = await prisma.player.update({
      where: { id },
      data: {
        approved: shouldApprove,
      },
    });

    if (shouldApprove && player.email) {
      // Resolve team name for the email (fire-and-forget)
      const teamNamePromise = player.teamId
        ? prisma.team.findUnique({ where: { id: player.teamId }, select: { name: true } }).then((t) => t?.name ?? null)
        : Promise.resolve(null);

      teamNamePromise
        .then((teamName) =>
          sendPlayerApprovedEmail({
            name: `${player.firstName} ${player.lastName}`,
            email: player.email as string,
            teamName,
          })
        )
        .catch((err) => console.error('[email] Failed to send player approved email:', err));
    }

    await logAudit(request, shouldApprove ? 'PLAYER_APPROVED' : 'PLAYER_UNAPPROVED', {
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
