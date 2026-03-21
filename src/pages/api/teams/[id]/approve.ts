import type { APIRoute } from 'astro';
import { requirePermission } from '../../../../features/rbac/middleware';
import { prisma } from '../../../../lib/prisma';
import { logAudit } from '../../../../features/cms/lib/audit';
import { sendTeamApprovedEmail } from '../../../../lib/email';
import { handleApiError } from '../../../../lib/apiError';

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

    const team = await prisma.team.update({
      where: { id },
      data: {
        approved: shouldApprove,
      },
    });

    if (shouldApprove) {
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

      // Email all coaches for this team (fire-and-forget)
      const coaches = await prisma.teamStaff.findMany({
        where: { teamId: id, role: 'COACH' },
        include: { staff: true },
      });
      for (const ts of coaches) {
        if (ts.staff.email) {
          sendTeamApprovedEmail({
            coachName: `${ts.staff.firstName} ${ts.staff.lastName}`,
            email: ts.staff.email,
            teamName: team.name,
          }).catch((err) => console.error('[email] Failed to send team approved email:', err));
        }
      }
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
