import type { APIRoute } from 'astro';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/features/rbac/middleware';
import { logAudit } from '@/features/cms/lib/audit';
import { dropOutPlayer, reinstatePlayer } from '@/features/player/data/datasources/dropout-repository';
import { handleApiError } from '@/lib/apiError';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

const bodySchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
  action: z.enum(['DROP_OUT', 'REINSTATE']),
  reason: z.string().trim().max(500).optional(),
});

/**
 * Drops out, or reinstates, several players at once from the admin players
 * list. Each player is handled on its own, so one that cannot change (for
 * example, not on an active roster) is reported without blocking the rest.
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const user = await requirePermission(request, 'players:update');
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return json({ error: parsed.error.issues[0]?.message ?? 'Invalid request.' }, 400);
    const { ids, action, reason } = parsed.data;
    const input = { reason: reason || null, changedById: user.id };

    const done: string[] = [];
    const skipped: { id: string; error: string }[] = [];
    for (const playerId of new Set(ids)) {
      try {
        const changed = await prisma.$transaction(
          async (tx) =>
            action === 'DROP_OUT' ? dropOutPlayer(tx, playerId, input) : [await reinstatePlayer(tx, playerId, user.id)],
          { maxWait: 10_000, timeout: 20_000 }
        );
        for (const roster of changed)
          logAudit(request, action === 'DROP_OUT' ? 'PLAYER_DROPPED_OUT' : 'PLAYER_REINSTATED', {
            playerId,
            rosterId: roster.id,
            teamId: roster.teamId,
            reason: action === 'DROP_OUT' ? input.reason : undefined,
          });
        done.push(playerId);
      } catch (error) {
        if (!(error instanceof Error && error.name === 'RosterDropoutError')) throw error;
        skipped.push({ id: playerId, error: error.message });
      }
    }
    return json({ done, skipped });
  } catch (error) {
    return handleApiError(error, 'bulk update player dropout', request);
  }
};
