import type { APIRoute } from 'astro';
import { getSiteSettingByKey } from '../../../features/cms/lib/queries';
import { updateSiteSetting, deleteSiteSetting } from '../../../features/cms/lib/mutations';
import { requireAdmin } from '../../../features/cms/lib/auth';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  try {
    // Try to get by ID first, then by key
    const setting = await getSiteSettingByKey(params.id!);

    if (!setting) {
      return new Response(JSON.stringify({ error: 'Setting not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(setting), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching setting:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch setting' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    await requireAdmin(request);
    const data = await request.json();

    const setting = await updateSiteSetting(params.id!, data);

    if (!setting) {
      return new Response(JSON.stringify({ error: 'Setting not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(setting), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error updating setting:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to update setting' }),
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
    const success = await deleteSiteSetting(params.id!);

    if (!success) {
      return new Response(JSON.stringify({ error: 'Failed to delete setting' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(null, { status: 204 });
  } catch (error: any) {
    console.error('Error deleting setting:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to delete setting' }),
      {
        status: error.message === 'Unauthorized' || error.message.includes('Forbidden') ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

