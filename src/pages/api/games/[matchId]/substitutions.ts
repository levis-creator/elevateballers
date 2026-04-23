import type { APIRoute } from 'astro';
import { createBulkSubstitutions } from '../../../../features/game-tracking/lib/mutations';
import { requireAuth } from '../../../../features/cms/lib/auth';
import { logAudit } from '../../../../features/cms/lib/audit';
import { handleApiError } from '../../../../lib/apiError';

export const prerender = false;

function badRequest(message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * POST /api/games/[matchId]/substitutions
 * Record multiple substitutions atomically in a single transaction.
 * Returns the full updated substitutions list and match players so the
 * client can avoid extra refetches.
 */
export const POST: APIRoute = async ({ params, request }) => {
  try {
    await requireAuth(request);
  } catch {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const matchId = params.matchId;
    if (!matchId) return badRequest('Match ID is required');

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') return badRequest('Invalid JSON body');

    const { teamId, period, secondsRemaining, pairs, clientBatchId } = body as {
      teamId?: string;
      period?: number | string;
      secondsRemaining?: number | string | null;
      pairs?: Array<{ playerInId?: string; playerOutId?: string }>;
      clientBatchId?: string;
    };

    if (!teamId || period === undefined || period === null || !Array.isArray(pairs) || pairs.length === 0) {
      return badRequest('teamId, period, and a non-empty pairs array are required');
    }

    const seenOut = new Set<string>();
    const seenIn = new Set<string>();
    const normalizedPairs: Array<{ playerInId: string; playerOutId: string }> = [];
    for (const p of pairs) {
      if (!p?.playerInId || !p?.playerOutId) {
        return badRequest('Each pair requires playerInId and playerOutId');
      }
      if (p.playerInId === p.playerOutId) {
        return badRequest('A player cannot be substituted with themselves');
      }
      if (seenOut.has(p.playerOutId)) {
        return badRequest(`Duplicate playerOutId in batch: ${p.playerOutId}`);
      }
      if (seenIn.has(p.playerInId)) {
        return badRequest(`Duplicate playerInId in batch: ${p.playerInId}`);
      }
      seenOut.add(p.playerOutId);
      seenIn.add(p.playerInId);
      normalizedPairs.push({ playerInId: p.playerInId, playerOutId: p.playerOutId });
    }

    const parsedPeriod = typeof period === 'string' ? parseInt(period, 10) : period;
    if (!Number.isFinite(parsedPeriod) || parsedPeriod <= 0) {
      return badRequest('period must be a positive integer');
    }

    const parsedSeconds =
      secondsRemaining === null || secondsRemaining === undefined
        ? null
        : typeof secondsRemaining === 'string'
          ? parseInt(secondsRemaining, 10)
          : secondsRemaining;

    const normalizedBatchId =
      typeof clientBatchId === 'string' && clientBatchId.trim().length > 0
        ? clientBatchId.trim().slice(0, 191)
        : undefined;

    const substitutionsCreated = await createBulkSubstitutions({
      matchId,
      teamId,
      period: parsedPeriod,
      secondsRemaining: parsedSeconds,
      pairs: normalizedPairs,
      clientBatchId: normalizedBatchId,
    });

    // Fire-and-forget audit — never awaited.
    logAudit(request, 'GAME_SUBSTITUTION_BULK_RECORDED', {
      matchId,
      teamId,
      period: parsedPeriod,
      pairCount: normalizedPairs.length,
      substitutionIds: substitutionsCreated.map((s) => s.id),
    });

    // Intentionally do NOT re-read substitutions or match players here.
    // The client merges `created` into its local state, and the parent view
    // already refetches match players with `cache: 'no-store'` after the
    // substitution resolves. Skipping these saves two DB roundtrips per
    // request and frees up the serverless connection pool immediately.
    return new Response(JSON.stringify({ created: substitutionsCreated }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error creating bulk substitutions:', error);
    return handleApiError(error, 'create bulk substitutions');
  }
};
