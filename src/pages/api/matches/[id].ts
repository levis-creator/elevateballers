import type { APIRoute } from 'astro';
import { getMatchById, getMatchWithFullDetails } from '../../../features/cms/lib/queries';
import { updateMatch, deleteMatch } from '../../../features/cms/lib/mutations';
import { requireAdmin } from '../../../features/cms/lib/auth';

export const prerender = false;

export const GET: APIRoute = async ({ params, url }) => {
  try {
    const includeDetails = url.searchParams.get('includeDetails') === 'true';
    
    let match;
    if (includeDetails) {
      console.log(`Fetching match ${params.id} with full details...`);
      match = await getMatchWithFullDetails(params.id!);
      console.log(`Match fetched:`, match ? 'Found' : 'Not found');
    } else {
      match = await getMatchById(params.id!);
    }

    if (!match) {
      return new Response(JSON.stringify({ error: 'Match not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(match), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error fetching match:', error);
    console.error('Error stack:', error.stack);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch match',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    await requireAdmin(request);
    const data = await request.json();

    // Convert date string to Date if provided
    if (data.date) {
      data.date = new Date(data.date);
    }

    // Handle stage field: convert __none placeholder or empty string to undefined
    if (data.stage !== undefined) {
      if (data.stage === '__none' || data.stage === '' || (typeof data.stage === 'string' && data.stage.trim() === '')) {
        data.stage = undefined;
      }
    }

    const match = await updateMatch(params.id!, data);

    if (!match) {
      return new Response(JSON.stringify({ error: 'Match not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(match), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error updating match:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to update match' }),
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
    const success = await deleteMatch(params.id!);

    if (!success) {
      return new Response(JSON.stringify({ error: 'Failed to delete match' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(null, { status: 204 });
  } catch (error: any) {
    console.error('Error deleting match:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to delete match' }),
      {
        status: error.message === 'Unauthorized' || error.message.includes('Forbidden') ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

