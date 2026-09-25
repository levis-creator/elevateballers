import type { APIRoute } from 'astro';
import { requireRosterScopedPermission } from '../../../features/rbac/middleware';
import { createPrismaSeasonRegistrationRepository } from '../../../features/registration/data/datasources/season-registration';
import { createSeasonRegistrationUseCases } from '../../../features/registration/domain/usecases/season-registration';
import { handleApiError } from '../../../lib/apiError';
import { logAudit } from '../../../features/cms/lib/audit';

export const prerender = false;

export const PATCH: APIRoute = async ({ params, request }) => {
  try {
    const reviewer = await requireRosterScopedPermission(request, params.id!, 'teams:update');
    const body = await request.json();
    const useCases = createSeasonRegistrationUseCases(createPrismaSeasonRegistrationRepository());
    // Attribute the decision to the signed-in reviewer, never to a client-supplied id.
    const reviewerId = reviewer.id;
    const status = body.status === 'APPROVED' ? 'APPROVED' : body.status === 'REJECTED' ? 'REJECTED' : 'WITHDRAWN';
    const result = status === 'APPROVED'
      ? await useCases.approveRosterPlayer(params.id!, reviewerId)
      : status === 'REJECTED'
        ? await useCases.rejectRosterPlayer(params.id!, reviewerId)
        : await useCases.withdrawRosterPlayer(params.id!, reviewerId);
    logAudit(request, `SEASON_ROSTER_${status}`, {
      rosterId: params.id,
      playerId: (result as any)?.playerId ?? null,
      teamId: (result as any)?.teamId ?? null,
    });
    return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) { return handleApiError(error, 'update season roster status', request); }
};
