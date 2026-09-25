import type { APIRoute } from 'astro';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/features/rbac/middleware';
import { logAudit } from '@/features/cms/lib/audit';
import {
  createSuspension,
  listPlayerAvailability,
  reportInjury,
  resolveAvailability,
} from '@/features/player/data/datasources/availability-repository';
import { handleApiError } from '@/lib/apiError';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

const createSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('SUSPENSION'),
    matchCount: z.number().int().min(1, 'Suspend for at least one match.').max(50),
    reason: z.string().trim().max(500).optional(),
  }),
  z.object({
    type: z.literal('INJURY'),
    reason: z.string().trim().max(500).optional(),
  }),
]);

const resolveSchema = z.object({ id: z.string().min(1) });

/** A player's suspensions and injuries, current and past. */
export const GET: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'players:read');
    return json(await listPlayerAvailability(params.id!));
  } catch (error) {
    return handleApiError(error, 'fetch player availability', request);
  }
};

/** Admins suspend a player for their team's next N matches, or record an injury. */
export const POST: APIRoute = async ({ params, request }) => {
  try {
    const user = await requirePermission(request, 'players:update');
    const parsed = createSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return json({ error: parsed.error.issues[0]?.message ?? 'Invalid request.' }, 400);
    const playerId = params.id!;
    const body = parsed.data;
    const reason = body.reason || null;

    if (body.type === 'SUSPENSION') {
      const record = await createSuspension({ playerId, matchCount: body.matchCount, reason, createdById: user.id });
      if (!record) return json({ error: 'Player not found.' }, 404);
      logAudit(request, 'PLAYER_SUSPENDED', { playerId, teamId: record.teamId, matchCount: body.matchCount, reason });
      return json(record, 201);
    }

    const player = await prisma.player.findUnique({ where: { id: playerId }, select: { teamId: true } });
    if (!player) return json({ error: 'Player not found.' }, 404);
    const record = await reportInjury({ playerId, teamId: player.teamId, reason, createdById: user.id });
    logAudit(request, 'PLAYER_INJURY_REPORTED', { playerId, teamId: player.teamId, note: reason });
    return json(record, 201);
  } catch (error) {
    return handleApiError(error, 'create player availability', request);
  }
};

/** Ends a suspension early or clears an injury. */
export const PATCH: APIRoute = async ({ params, request }) => {
  try {
    const user = await requirePermission(request, 'players:update');
    const parsed = resolveSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return json({ error: 'Record id is required.' }, 400);
    const playerId = params.id!;
    const record = await prisma.playerAvailability.findFirst({
      where: { id: parsed.data.id, playerId },
      select: { type: true },
    });
    if (!record) return json({ error: 'Record not found.' }, 404);
    const resolved = await resolveAvailability(parsed.data.id, playerId, user.id);
    if (resolved)
      logAudit(request, record.type === 'SUSPENSION' ? 'PLAYER_SUSPENSION_LIFTED' : 'PLAYER_MARKED_FIT', {
        playerId,
        recordId: parsed.data.id,
      });
    return json({ resolved });
  } catch (error) {
    return handleApiError(error, 'resolve player availability', request);
  }
};
