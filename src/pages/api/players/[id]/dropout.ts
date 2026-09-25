import type { APIRoute } from 'astro';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/features/rbac/middleware';
import { logAudit } from '@/features/cms/lib/audit';
import {
  listPlayerRosters,
  markRosterDroppedOut,
  reinstateRoster,
} from '@/features/player/data/datasources/dropout-repository';
import { handleApiError } from '@/lib/apiError';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

const bodySchema = z.object({
  rosterId: z.string().min(1),
  action: z.enum(['DROP_OUT', 'REINSTATE']),
  reason: z.string().trim().max(500).optional(),
});

/** The player's active and dropped-out roster entries. */
export const GET: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'players:read');
    return json(await listPlayerRosters(params.id!));
  } catch (error) {
    return handleApiError(error, 'fetch player dropout status', request);
  }
};

/** Admins record that a player left the league, or bring a dropped-out player back. */
export const PATCH: APIRoute = async ({ params, request }) => {
  try {
    const user = await requirePermission(request, 'players:update');
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return json({ error: parsed.error.issues[0]?.message ?? 'Invalid request.' }, 400);
    const { rosterId, action, reason } = parsed.data;
    const playerId = params.id!;
    const owned = await prisma.seasonTeamPlayer.findFirst({ where: { id: rosterId, playerId }, select: { id: true } });
    if (!owned) return json({ error: 'Roster entry not found for this player.' }, 404);

    const roster = await prisma.$transaction(
      (tx) =>
        action === 'DROP_OUT'
          ? markRosterDroppedOut(tx, rosterId, { reason: reason || null, changedById: user.id })
          : reinstateRoster(tx, rosterId, user.id),
      { maxWait: 10_000, timeout: 20_000 }
    );
    logAudit(request, action === 'DROP_OUT' ? 'PLAYER_DROPPED_OUT' : 'PLAYER_REINSTATED', {
      playerId,
      rosterId,
      teamId: roster.teamId,
      reason: action === 'DROP_OUT' ? reason || null : undefined,
    });
    return json({ message: action === 'DROP_OUT' ? 'Player marked as dropped out.' : 'Player reinstated.' });
  } catch (error) {
    return handleApiError(error, 'update player dropout', request);
  }
};
