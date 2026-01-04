import type { APIRoute } from 'astro';
import { getTeamById } from '../../../features/cms/lib/queries';
import { updateTeam, deleteTeam } from '../../../features/cms/lib/mutations';
import { requireAdmin } from '../../../features/cms/lib/auth';

export const prerender = false;
import { prisma } from '../../../lib/prisma';

export const GET: APIRoute = async ({ params }) => {
  try {
    const team = await getTeamById(params.id!);

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
    return new Response(JSON.stringify({ error: 'Failed to fetch team' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    await requireAdmin(request);
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

    return new Response(JSON.stringify(team), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error updating team:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to update team' }),
      {
        status: error.message === 'Unauthorized' || error.message.includes('Forbidden') ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    await requireAdmin(request);
    const success = await deleteTeam(params.id!);

    if (!success) {
      return new Response(JSON.stringify({ error: 'Failed to delete team' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(null, { status: 204 });
  } catch (error: any) {
    console.error('Error deleting team:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to delete team' }),
      {
        status: error.message === 'Unauthorized' || error.message.includes('Forbidden') ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

