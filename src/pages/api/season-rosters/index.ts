import type { APIRoute } from 'astro';
import { requireSeasonTeamScopedPermission } from '../../../features/rbac/middleware';
import { createPrismaSeasonRegistrationRepository } from '../../../features/registration/data/datasources/season-registration';
import { createSeasonRegistrationUseCases } from '../../../features/registration/domain/usecases/season-registration';
import { handleApiError } from '../../../lib/apiError';
import { logAudit } from '../../../features/cms/lib/audit';

export const prerender = false;

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export const GET: APIRoute = async ({ url, request }) => {
  try {
    const seasonTeamId = url.searchParams.get('seasonTeamId');
    if (!seasonTeamId) return json({ error: 'seasonTeamId is required' }, 400);
    let includePending = false;
    try { await requireSeasonTeamScopedPermission(request, seasonTeamId, 'teams:update'); includePending = true; } catch { /* public approved roster */ }
    const useCases = createSeasonRegistrationUseCases(createPrismaSeasonRegistrationRepository());
    return json(await useCases.listRoster(seasonTeamId, includePending));
  } catch (error) { return handleApiError(error, 'list season roster', request); }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    let actor;
    if (body.action === 'TRANSFER') {
      actor = await requireSeasonTeamScopedPermission(request, String(body.fromSeasonTeamId), 'teams:update');
      await requireSeasonTeamScopedPermission(request, String(body.toSeasonTeamId), 'teams:update');
    } else {
      actor = await requireSeasonTeamScopedPermission(request, String(body.seasonTeamId), 'teams:update');
    }
    const useCases = createSeasonRegistrationUseCases(createPrismaSeasonRegistrationRepository());
    if (body.action === 'TRANSFER') {
      // The requester is the signed-in user, never a client-supplied id.
      const transfer = await useCases.requestTransfer({ playerId: String(body.playerId), fromSeasonTeamId: String(body.fromSeasonTeamId), toSeasonTeamId: String(body.toSeasonTeamId), reason: body.reason, requestedById: actor.id });
      logAudit(request, 'SEASON_TRANSFER_REQUESTED', { playerId: String(body.playerId), fromSeasonTeamId: String(body.fromSeasonTeamId), toSeasonTeamId: String(body.toSeasonTeamId) });
      return json(transfer, 201);
    }
    const roster = await useCases.addRosterPlayer(String(body.seasonTeamId), String(body.playerId), body.jerseyNumber == null ? undefined : Number(body.jerseyNumber), body.position);
    logAudit(request, 'SEASON_ROSTER_PLAYER_ADDED', { seasonTeamId: String(body.seasonTeamId), playerId: String(body.playerId), rosterId: (roster as any)?.id ?? null });
    return json(roster, 201);
  } catch (error) { return handleApiError(error, 'create season roster change', request); }
};
