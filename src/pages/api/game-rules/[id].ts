import type { APIRoute } from 'astro';
import { getGameRules } from '../../../features/game-tracking/lib/queries';
import { updateGameRules, deleteGameRules } from '../../../features/game-tracking/lib/mutations';
import { requireAuth } from '../../../features/cms/lib/auth';

export const prerender = false;

/**
 * GET /api/game-rules/[id]
 * Get game rules by ID
 */
export const GET: APIRoute = async ({ params }) => {
  try {
    const id = params.id;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Game rules ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const rules = await getGameRules(id);
    if (!rules) {
      return new Response(JSON.stringify({ error: 'Game rules not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(rules), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error fetching game rules:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch game rules' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * PUT /api/game-rules/[id]
 * Update game rules
 */
export const PUT: APIRoute = async ({ params, request }) => {
  try {
    await requireAuth(request);
  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const id = params.id;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Game rules ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const rules = await updateGameRules(id, body);

    if (!rules) {
      return new Response(JSON.stringify({ error: 'Failed to update game rules' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(rules), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error updating game rules:', error);
    return new Response(JSON.stringify({ error: 'Failed to update game rules' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * DELETE /api/game-rules/[id]
 * Delete game rules
 */
export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    await requireAuth(request);
  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const id = params.id;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Game rules ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const success = await deleteGameRules(id);
    if (!success) {
      return new Response(JSON.stringify({ error: 'Failed to delete game rules' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error deleting game rules:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete game rules' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
