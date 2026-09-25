import type { APIRoute } from 'astro';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/features/rbac/middleware';
import { logAudit } from '@/features/cms/lib/audit';
import { getTransferOptions, transferPlayer } from '@/features/player/data/datasources/transfer-repository';
import { notifyCoachesOfTransfer } from '@/features/player/application/transfer-emails';
import { handleApiError } from '@/lib/apiError';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

const bodySchema = z.object({
  toSeasonTeamId: z.string().min(1, 'Choose the team to transfer to.'),
  reason: z.string().trim().max(500).optional(),
});

/** Where the player can be transferred: each active roster with the other teams in its edition. */
export const GET: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'players:update');
    return json(await getTransferOptions(params.id!));
  } catch (error) {
    return handleApiError(error, 'fetch player transfer options', request);
  }
};

/** An admin moves the player to another team in the same edition; it takes effect at once. */
export const POST: APIRoute = async ({ params, request }) => {
  try {
    const user = await requirePermission(request, 'players:update');
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return json({ error: parsed.error.issues[0]?.message ?? 'Invalid request.' }, 400);
    const playerId = params.id!;
    const player = await prisma.player.findUnique({ where: { id: playerId }, select: { firstName: true, lastName: true } });
    if (!player) return json({ error: 'Player not found.' }, 404);

    const result = await prisma.$transaction(
      (tx) =>
        transferPlayer(tx, {
          playerId,
          toSeasonTeamId: parsed.data.toSeasonTeamId,
          reason: parsed.data.reason || null,
          changedById: user.id,
        }),
      { maxWait: 10_000, timeout: 20_000 }
    );
    logAudit(request, 'PLAYER_TRANSFERRED', {
      playerId,
      transferId: result.transferId,
      fromTeamId: result.fromTeamId,
      toTeamId: result.toTeamId,
      fromTeam: result.fromTeamName,
      toTeam: result.toTeamName,
      reason: parsed.data.reason || null,
    });
    await notifyCoachesOfTransfer({
      transferId: result.transferId,
      playerName: `${player.firstName ?? ''} ${player.lastName ?? ''}`.trim() || 'A player',
      fromTeamId: result.fromTeamId,
      fromTeamName: result.fromTeamName,
      toTeamId: result.toTeamId,
      toTeamName: result.toTeamName,
    });
    return json({ message: `Transferred to ${result.toTeamName}.`, toTeamName: result.toTeamName });
  } catch (error) {
    return handleApiError(error, 'transfer player', request);
  }
};
