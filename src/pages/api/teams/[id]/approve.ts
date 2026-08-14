import type { APIRoute } from 'astro';
import { requirePermission } from '../../../../features/rbac/middleware';
import { prisma } from '../../../../lib/prisma';
import { logAudit } from '../../../../features/cms/lib/audit';
import { handleApiError } from '../../../../lib/apiError';
import { approvePendingSeasonRegistrations } from '../../../../features/registration/data/datasources/public-submission';
import { notifyTeamRegistrationDecision } from '../../../../features/registration/application/send-registration-decision';

export const prerender = false;

export const PATCH: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'teams:approve');
    const { id } = params;
    const data = await request.json();

    if (!id) {
      return new Response(JSON.stringify({ error: 'Team ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const shouldApprove = data.approved ?? true;

    const previous = await prisma.team.findUnique({ where: { id }, select: { approved: true } });

    const team = await prisma.team.update({
      where: { id },
      data: {
        approved: shouldApprove,
      },
    });

    if (shouldApprove) {
      await approvePendingSeasonRegistrations([id]);
      await prisma.staff.updateMany({
        where: {
          teams: {
            some: { teamId: id },
          },
        },
        data: {
          approved: true,
        },
      });

    }

    if (previous && previous.approved !== shouldApprove) {
      void notifyTeamRegistrationDecision(id, shouldApprove)
        .catch((err) => console.error('[email] Failed to send team decision email:', err));
    }

    await logAudit(request, shouldApprove ? 'TEAM_APPROVED' : 'TEAM_UNAPPROVED', {
      teamId: id,
    });

    return new Response(JSON.stringify(team), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error approving team:', error);
    return handleApiError(error, 'approve team', request);
  }
};
