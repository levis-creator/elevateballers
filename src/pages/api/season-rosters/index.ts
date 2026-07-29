import type { APIRoute } from 'astro';
import { requirePermission } from '../../../features/rbac/middleware';
import { createPrismaSeasonRegistrationRepository } from '../../../features/registration/data/datasources/season-registration';
import { createSeasonRegistrationUseCases } from '../../../features/registration/domain/usecases/season-registration';
import { handleApiError } from '../../../lib/apiError';

export const prerender = false;

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export const GET: APIRoute = async ({ url, request }) => {
  try {
    const seasonTeamId = url.searchParams.get('seasonTeamId');
    if (!seasonTeamId) return json({ error: 'seasonTeamId is required' }, 400);
    let includePending = false;
    try { await requirePermission(request, 'teams:update'); includePending = true; } catch { /* public approved roster */ }
    const useCases = createSeasonRegistrationUseCases(createPrismaSeasonRegistrationRepository());
    return json(await useCases.listRoster(seasonTeamId, includePending));
  } catch (error) { return handleApiError(error, 'list season roster', request); }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    await requirePermission(request, 'teams:update');
    const body = await request.json();
    const useCases = createSeasonRegistrationUseCases(createPrismaSeasonRegistrationRepository());
    if (body.action === 'TRANSFER') {
      return json(await useCases.requestTransfer({ playerId: String(body.playerId), fromSeasonTeamId: String(body.fromSeasonTeamId), toSeasonTeamId: String(body.toSeasonTeamId), reason: body.reason, requestedById: body.requestedById }), 201);
    }
    return json(await useCases.addRosterPlayer(String(body.seasonTeamId), String(body.playerId), body.jerseyNumber == null ? undefined : Number(body.jerseyNumber), body.position), 201);
  } catch (error) { return handleApiError(error, 'create season roster change', request); }
};
