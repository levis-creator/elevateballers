import type { APIRoute } from 'astro';
import { requireAnyPermission } from '../../../features/rbac/middleware';
import {
  bulkReviewRegistrations,
  bulkReviewRosterProposals,
  getRegistrationReviewQueue,
} from '../../../features/registration/data/datasources/review-queue';
import { handleApiError } from '../../../lib/apiError';
import { logAudit } from '../../../features/cms/lib/audit';
import { notifyCoachesOfRosterDecisions } from '../../../features/registration/application/roster-request-emails';

export const prerender = false;
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export const GET: APIRoute = async ({ url, request }) => {
  try {
    await requireAnyPermission(request, ['players:update', 'teams:update']);
    const page = Math.max(1, Number(url.searchParams.get('page') || 1));
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || 25)));
    return json(
      await getRegistrationReviewQueue({
        page,
        limit,
        kind: url.searchParams.get('kind') || undefined,
        status: url.searchParams.get('status') || undefined,
        search: url.searchParams.get('search') || undefined,
      })
    );
  } catch (error) {
    return handleApiError(error, 'fetch registration review queue', request);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const reviewer = await requireAnyPermission(request, ['players:update', 'teams:update']);
    const body = await request.json();
    if (
      !['PLAYER', 'TEAM', 'ROSTER'].includes(body.kind) ||
      !Array.isArray(body.ids) ||
      !['APPROVE', 'REJECT'].includes(body.action)
    )
      return json({ error: 'kind, ids, and action are required' }, 400);
    if (body.kind === 'ROSTER') {
      const { count, decisions } = await bulkReviewRosterProposals({
        ids: body.ids.map(String),
        action: body.action,
        reviewerId: reviewer.id,
      });
      // One entry per player so each decision shows in that player's activity.
      for (const d of decisions)
        logAudit(request, d.approved ? 'ROSTER_REQUEST_APPROVED' : 'ROSTER_REQUEST_REJECTED', {
          rosterId: d.rosterId,
          playerId: d.playerId,
          teamId: d.teamId,
          type: d.type,
        });
      await notifyCoachesOfRosterDecisions(decisions);
      return json({ count });
    }
    const ids = body.ids.map(String);
    const result = await bulkReviewRegistrations({ kind: body.kind, ids, action: body.action });
    if (result.count)
      logAudit(request, `${body.kind}S_BULK_${body.action === 'APPROVE' ? 'APPROVED' : 'REJECTED'}`, {
        count: result.count,
        ids,
      });
    return json(result);
  } catch (error) {
    return handleApiError(error, 'bulk review registrations', request);
  }
};
