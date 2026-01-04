import type { APIRoute } from 'astro';
import { getSeasonById } from '../../../features/cms/lib/queries';
import { updateSeason, deleteSeason } from '../../../features/cms/lib/mutations';
import { requireAdmin } from '../../../features/cms/lib/auth';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  try {
    const season = await getSeasonById(params.id!);
    if (!season) {
      return new Response(JSON.stringify({ error: 'Season not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify(season), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching season:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch season' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    await requireAdmin(request);
    const data = await request.json();
    const season = await updateSeason(params.id!, data);
    if (!season) {
      return new Response(JSON.stringify({ error: 'Season not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify(season), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error updating season:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to update season' }),
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
    const success = await deleteSeason(params.id!);
    if (!success) {
      return new Response(JSON.stringify({ error: 'Failed to delete season' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(null, { status: 204 });
  } catch (error: any) {
    console.error('Error deleting season:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to delete season' }),
      {
        status: error.message === 'Unauthorized' || error.message.includes('Forbidden') ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

