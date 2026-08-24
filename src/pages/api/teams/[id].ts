import type { APIRoute } from 'astro';
import { getTeamById } from '../../../features/cms/lib/queries';
import { updateTeam, deleteTeam } from '../../../features/cms/lib/mutations';
import { requireTeamScopedPermission } from '../../../features/rbac/middleware';
import { logAudit } from '../../../features/cms/lib/audit';

import { handleApiError } from '../../../lib/apiError';
import type { UpdateTeamInput } from '../../../features/cms/types';
import { approvePendingSeasonRegistrations } from '../../../features/registration/data/datasources/public-submission';
import { notifyTeamRegistrationDecision } from '../../../features/registration/application/send-registration-decision';
export const prerender = false;
import { prisma } from '../../../lib/prisma';

export const GET: APIRoute = async ({ params, request }) => {
  try {
    // Try to get admin user, but don't fail if not authenticated
    let includeUnapproved = false;
    try {
      await requireTeamScopedPermission(request, params.id!, 'teams:update');
      includeUnapproved = true; // Admins can see unapproved teams
    } catch {
      // Not an admin, only show approved teams
      includeUnapproved = false;
    }

    const team = await getTeamById(params.id!, includeUnapproved);

    if (!team) {
      return new Response(JSON.stringify({ error: 'Team not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(team), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching team:', error);
    return handleApiError(error, "fetch team");
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    await requireTeamScopedPermission(request, params.id!, 'teams:update');
    const data = await request.json();
    const previousApproval = data.approved !== undefined
      ? await prisma.team.findUnique({ where: { id: params.id! }, select: { approved: true } })
      : null;

    const founded = data.founded === undefined || data.founded === '' || data.founded === null
      ? null
      : Number(data.founded);
    if (founded !== null && (!Number.isInteger(founded) || founded < 1800 || founded > new Date().getFullYear())) {
      return new Response(JSON.stringify({ error: 'Founded must be a valid year' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (data.shortName !== undefined && String(data.shortName).length > 18) {
      return new Response(JSON.stringify({ error: 'Short name must be 18 characters or fewer' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    if (data.abbreviation !== undefined && (String(data.abbreviation).length < 3 || String(data.abbreviation).length > 5)) {
      return new Response(JSON.stringify({ error: 'Abbreviation must be 3–5 characters' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const teamPayload = {
      ...(data.name !== undefined ? { name: String(data.name).trim() } : {}),
      ...(data.nickname !== undefined ? { nickname: data.nickname ? String(data.nickname).trim() : null } : {}),
      ...(data.shortName !== undefined ? { shortName: data.shortName ? String(data.shortName).trim() : null } : {}),
      ...(data.abbreviation !== undefined ? { abbreviation: data.abbreviation ? String(data.abbreviation).trim().toUpperCase() : null } : {}),
      ...(data.slug !== undefined ? { slug: data.slug ? String(data.slug).trim() : null } : {}),
      ...(data.logo !== undefined ? { logo: data.logo ? String(data.logo).trim() : null } : {}),
      ...(data.description !== undefined ? { description: data.description ? String(data.description).trim() : null } : {}),
      ...(data.venue !== undefined ? { venue: data.venue ? String(data.venue).trim() : null } : {}),
      ...(data.city !== undefined ? { city: data.city ? String(data.city).trim() : null } : {}),
      ...(data.founded !== undefined ? { founded } : {}),
      ...(data.contactEmail !== undefined ? { contactEmail: data.contactEmail ? String(data.contactEmail).trim() : null } : {}),
      ...(data.primaryColor !== undefined ? { primaryColor: data.primaryColor ? String(data.primaryColor).trim() : null } : {}),
      ...(data.secondaryColor !== undefined ? { secondaryColor: data.secondaryColor ? String(data.secondaryColor).trim() : null } : {}),
      ...(data.approved !== undefined ? { approved: Boolean(data.approved) } : {}),
    };

    // If name is being updated, check if it's unique
    if (teamPayload.name) {
      const existing = await prisma.team.findFirst({
        where: {
          name: teamPayload.name,
          id: { not: params.id! },
        },
        select: {
          id: true,
          name: true,
        },
      });

      if (existing) {
        return new Response(JSON.stringify({ error: 'A team with this name already exists' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    const team = await updateTeam(params.id!, teamPayload as UpdateTeamInput);

    if (!team) {
      return new Response(JSON.stringify({ error: 'Team not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (data.approved === true) await approvePendingSeasonRegistrations([team.id]);
    if (previousApproval && previousApproval.approved !== Boolean(data.approved)) {
      void notifyTeamRegistrationDecision(team.id, Boolean(data.approved))
        .catch((error) => console.error('[email] Failed to send team decision email:', error));
    }

    await logAudit(request, 'TEAM_UPDATED', {
      teamId: team.id,
      name: team.name,
    });

    return new Response(JSON.stringify(team), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'update team', request);
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    await requireTeamScopedPermission(request, params.id!, 'teams:update');
    const success = await deleteTeam(params.id!);

    if (!success) {
      return new Response(JSON.stringify({ error: 'Team not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await logAudit(request, 'TEAM_DELETED', {
      teamId: params.id,
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error, 'delete team', request);
  }
};
