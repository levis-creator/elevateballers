import type { APIRoute } from 'astro';
import { getLeagueById } from '../../../features/cms/lib/queries';
import { updateLeague, deleteLeague } from '../../../features/cms/lib/mutations';
import { requireAdmin } from '../../../features/cms/lib/auth';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  try {
    const league = await getLeagueById(params.id!);

    if (!league) {
      return new Response(JSON.stringify({ error: 'League not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(league), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching league:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch league' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    await requireAdmin(request);
    const data = await request.json();

    // Convert date strings to Date if provided
    if (data.startDate) {
      data.startDate = new Date(data.startDate);
    }
    if (data.endDate) {
      data.endDate = new Date(data.endDate);
    }

    const league = await updateLeague(params.id!, data);

    if (!league) {
      return new Response(JSON.stringify({ error: 'League not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(league), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error updating league:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to update league' }),
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
    const success = await deleteLeague(params.id!);

    if (!success) {
      return new Response(JSON.stringify({ error: 'Failed to delete league' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(null, { status: 204 });
  } catch (error: any) {
    console.error('Error deleting league:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to delete league' }),
      {
        status: error.message === 'Unauthorized' || error.message.includes('Forbidden') ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

