import type { APIRoute } from 'astro';
import { getStaffByTeam, getTeamById } from '../../../../features/cms/lib/queries';
import { assignStaffToTeam, removeStaffFromTeam, updateTeamStaff } from '../../../../features/cms/lib/mutations';
import { requirePermission } from '../../../../features/rbac/middleware';
import { logAudit } from '../../../../features/cms/lib/audit';

import { handleApiError } from '../../../../lib/apiError';
export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  try {
    const teamStaff = await getStaffByTeam(params.id!, true);

    return new Response(JSON.stringify(teamStaff), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching team staff:', error);
    return handleApiError(error, "fetch team staff");
  }
};

export const POST: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'teams:manage_staff');
    const data = await request.json();

    // Validate required fields
    if (!data.staffId || !data.role) {
      return new Response(JSON.stringify({ error: 'Staff ID and role are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if team exists (admins can see unapproved teams)
    const team = await getTeamById(params.id!, true);
    if (!team) {
      return new Response(JSON.stringify({ error: 'Team not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const teamStaff = await assignStaffToTeam({
      teamId: params.id!,
      staffId: data.staffId,
      role: data.role,
    });

    await logAudit(request, 'TEAM_STAFF_ASSIGNED', {
      teamId: params.id,
      staffId: data.staffId,
      role: data.role,
    });

    return new Response(JSON.stringify(teamStaff), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'assign staff to team', request);
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'teams:manage_staff');
    const data = await request.json();

    if (!data.teamStaffId) {
      return new Response(JSON.stringify({ error: 'Team staff ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const teamStaff = await updateTeamStaff(data.teamStaffId, {
      role: data.role,
    });

    if (!teamStaff) {
      return new Response(JSON.stringify({ error: 'Team staff assignment not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await logAudit(request, 'TEAM_STAFF_UPDATED', {
      teamStaffId: data.teamStaffId,
      role: data.role,
    });

    return new Response(JSON.stringify(teamStaff), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'update team staff', request);
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'teams:manage_staff');
    const url = new URL(request.url);
    const teamStaffId = url.searchParams.get('teamStaffId');

    if (!teamStaffId) {
      return new Response(JSON.stringify({ error: 'Team staff ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const success = await removeStaffFromTeam(teamStaffId);

    if (!success) {
      return new Response(JSON.stringify({ error: 'Team staff assignment not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await logAudit(request, 'TEAM_STAFF_REMOVED', {
      teamStaffId,
      teamId: params.id,
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error, 'remove staff from team', request);
  }
};
