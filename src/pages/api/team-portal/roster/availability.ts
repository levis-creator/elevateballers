import type { APIRoute } from 'astro';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/features/cms/lib/auth';
import { logAudit } from '@/features/cms/lib/audit';
import { requireActiveTeamContext } from '@/features/team-portal/application/team-portal-access';
import { getActiveSeasonTeam } from '@/features/team-portal/data/datasources/team-portal-repository';
import { markFit, reportInjury } from '@/features/player/data/datasources/availability-repository';
import { handleApiError } from '@/lib/apiError';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

const bodySchema = z.object({
  teamId: z.string().min(1),
  playerId: z.string().min(1),
  injured: z.boolean(),
  note: z.string().trim().max(500).optional(),
});

/** Coaches mark their own players injured, and fit again once they have recovered. */
export const PUT: APIRoute = async ({ request }) => {
  try {
    const user = await getCurrentUser(request);
    if (!user) return json({ error: 'Sign-in required.' }, 401);
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return json({ error: parsed.error.issues[0]?.message ?? 'Invalid request.' }, 400);
    const { teamId, playerId, injured, note } = parsed.data;
    const { team } = await requireActiveTeamContext(user.id, teamId);
    const { seasonTeam } = await getActiveSeasonTeam(team.id);
    if (!seasonTeam) return json({ error: 'This team is not registered for the active season.' }, 409);

    const onRoster = await prisma.seasonTeamPlayer.findFirst({
      where: { seasonTeamId: seasonTeam.id, playerId, status: 'APPROVED', leftAt: null },
      select: { id: true },
    });
    if (!onRoster) return json({ error: 'Only approved players on your active roster can be updated.' }, 404);

    if (injured) {
      await reportInjury({ playerId, teamId: team.id, reason: note || null, createdById: user.id });
      logAudit(request, 'PLAYER_INJURY_REPORTED', { teamId: team.id, playerId, note: note || null });
      return json({ message: 'Player marked as injured.' });
    }
    const cleared = await markFit(playerId, user.id);
    if (cleared) logAudit(request, 'PLAYER_MARKED_FIT', { teamId: team.id, playerId });
    return json({ message: 'Player marked as fit.' });
  } catch (error) {
    return handleApiError(error, 'update Team Portal player availability', request);
  }
};
