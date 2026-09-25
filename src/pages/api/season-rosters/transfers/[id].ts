import type { APIRoute } from 'astro';
import { requireTransferScopedPermission } from '../../../../features/rbac/middleware';
import { createPrismaSeasonRegistrationRepository } from '../../../../features/registration/data/datasources/season-registration';
import { createSeasonRegistrationUseCases } from '../../../../features/registration/domain/usecases/season-registration';
import { handleApiError } from '../../../../lib/apiError';
import { logAudit } from '../../../../features/cms/lib/audit';

export const prerender = false;

export const PATCH: APIRoute = async ({ params, request }) => {
  try {
    const reviewer = await requireTransferScopedPermission(request, params.id!, 'teams:update');
    const body = await request.json();
    if (body.status !== 'APPROVED') return new Response(JSON.stringify({ error: 'Only approval is supported for transfers' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    const useCases = createSeasonRegistrationUseCases(createPrismaSeasonRegistrationRepository());
    const result = await useCases.approveTransfer(params.id!, reviewer.id);
    logAudit(request, 'SEASON_TRANSFER_APPROVED', { transferId: params.id });
    return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) { return handleApiError(error, 'approve season transfer', request); }
};
