import type { APIRoute } from 'astro';
import { requirePermission } from '../../../../features/rbac/middleware';
import { logAudit } from '../../../../features/cms/lib/audit';
import { handleApiError, json } from '../../../../lib/apiError';
import { DuplicateMergeConflict, mergeDuplicatePlayers } from '../../../../features/registration/data/merge-duplicate-players';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const reviewer = await requirePermission(request, 'players:update');
    const body = await request.json();
    const matchKey = typeof body.matchKey === 'string' ? body.matchKey.trim() : '';
    const primaryPlayerId = typeof body.primaryPlayerId === 'string' ? body.primaryPlayerId.trim() : '';
    const secondaryPlayerId = typeof body.secondaryPlayerId === 'string' ? body.secondaryPlayerId.trim() : '';
    if (!matchKey || !primaryPlayerId || !secondaryPlayerId || body.confirm !== true) return json({ error: 'A duplicate key, two players, and explicit confirmation are required.' }, 400);
    const result = await mergeDuplicatePlayers({ matchKey, primaryPlayerId, secondaryPlayerId, reviewedById: reviewer.id });
    await logAudit(request, 'PLAYER_DUPLICATES_MERGED', result);
    return json(result, 200);
  } catch (error) {
    if (error instanceof DuplicateMergeConflict) return json({ error: error.message, conflicts: error.conflicts }, 409);
    return handleApiError(error, 'merge duplicate player records', request);
  }
};
