import type { APIRoute } from 'astro';
import { getGameRules } from '../../../features/game-tracking/lib/queries';
import { updateGameRules, deleteGameRules } from '../../../features/game-tracking/lib/mutations';
import { requireAuth } from '../../../features/cms/lib/auth';
import { handleApiError } from '../../../lib/apiError';

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
  } catch (error) {
    return handleApiError(error, 'fetch game rules', request);
  }
};

/**
 * PUT /api/game-rules/[id]
 * Update game rules
 */
export const PUT: APIRoute = async ({ params, request }) => {
  try {
    await requireAuth(request);

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
  } catch (error) {
    return handleApiError(error, 'update game rules', request);
  }
};

/**
 * DELETE /api/game-rules/[id]
 * Delete game rules
 */
export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    await requireAuth(request);

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
  } catch (error) {
    return handleApiError(error, 'delete game rules', request);
  }
};
