import type { APIRoute } from 'astro';
import { getAllGameRules, getGameRules } from '../../../features/game-tracking/data/datasources/queries';
import { createGameRules, updateGameRules, deleteGameRules } from '../../../features/game-tracking/data/datasources/mutations';
import { requireAuth } from '@/features/auth/lib/auth';
import { logAudit } from '../../../features/audit/lib/audit';
import { handleApiError } from '../../../lib/apiError';

export const prerender = false;

/**
 * GET /api/game-rules
 * Get all game rules or a specific rule by ID
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    await requireAuth(request);

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
  } catch (error) {
    return handleApiError(error, 'fetch game rules', request);
  }
};

/**
 * POST /api/game-rules
 * Create new game rules
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    await requireAuth(request);

    const body = await request.json();
    const rules = await createGameRules(body);

    if (!rules) {
      return new Response(JSON.stringify({ error: 'Failed to create game rules' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await logAudit(request, 'GAME_RULES_CREATED', {
      id: (rules as any)?.id ?? null,
      hasRules: Boolean(rules),
    });

    return new Response(JSON.stringify(rules), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'create game rules', request);
  }
};
