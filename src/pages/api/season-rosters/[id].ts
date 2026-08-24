import type { APIRoute } from 'astro';
import { requireRosterScopedPermission } from '../../../features/rbac/middleware';
import { createPrismaSeasonRegistrationRepository } from '../../../features/registration/data/datasources/season-registration';
import { createSeasonRegistrationUseCases } from '../../../features/registration/domain/usecases/season-registration';
import { handleApiError } from '../../../lib/apiError';

export const prerender = false;

export const PATCH: APIRoute = async ({ params, request }) => {
  try {
    await requireRosterScopedPermission(request, params.id!, 'teams:update');
    const body = await request.json();
    const useCases = createSeasonRegistrationUseCases(createPrismaSeasonRegistrationRepository());
    const reviewerId = String(body.reviewerId ?? 'admin');
    const result = body.status === 'APPROVED'
      ? await useCases.approveRosterPlayer(params.id!, reviewerId)
      : body.status === 'REJECTED'
        ? await useCases.rejectRosterPlayer(params.id!, reviewerId)
        : await useCases.withdrawRosterPlayer(params.id!, reviewerId);
    return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) { return handleApiError(error, 'update season roster status', request); }
};
