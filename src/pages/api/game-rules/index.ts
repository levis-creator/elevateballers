import type { APIRoute } from 'astro';
import { getAllGameRules, getGameRules } from '../../../features/game-tracking/lib/queries';
import { createGameRules, updateGameRules, deleteGameRules } from '../../../features/game-tracking/lib/mutations';
import { requireAuth } from '../../../features/cms/lib/auth';

export const prerender = false;

/**
 * GET /api/game-rules
 * Get all game rules or a specific rule by ID
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    await requireAuth(request);
  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (id) {
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
    }

    const rules = await getAllGameRules();
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
 * POST /api/game-rules
 * Create new game rules
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    await requireAuth(request);
  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const rules = await createGameRules(body);

    if (!rules) {
      return new Response(JSON.stringify({ error: 'Failed to create game rules' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(rules), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error creating game rules:', error);
    return new Response(JSON.stringify({ error: 'Failed to create game rules' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
