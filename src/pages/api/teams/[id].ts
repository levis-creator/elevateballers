import type { APIRoute } from 'astro';
import { getTeamById } from '../../../features/cms/lib/queries';
import { updateTeam, deleteTeam } from '../../../features/cms/lib/mutations';
import { requirePermission } from '../../../features/rbac/middleware';
import { logAudit } from '../../../features/cms/lib/audit';

import { handleApiError } from '../../../lib/apiError';
export const prerender = false;
import { prisma } from '../../../lib/prisma';

export const GET: APIRoute = async ({ params, request }) => {
  try {
    // Try to get admin user, but don't fail if not authenticated
    let includeUnapproved = false;
    try {
      await requirePermission(request, 'teams:update');
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
    await requirePermission(request, 'teams:update');
    const data = await request.json();

    // If name is being updated, check if it's unique
    if (data.name) {
      const existing = await prisma.team.findFirst({
        where: {
          name: data.name,
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

    const team = await updateTeam(params.id!, data);

    if (!team) {
      return new Response(JSON.stringify({ error: 'Team not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
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
    await requirePermission(request, 'teams:update');
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
