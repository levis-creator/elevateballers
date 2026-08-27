import type { APIRoute } from 'astro';
import { requireAnyPermission } from '../../../features/rbac/middleware';
import {
  bulkReviewRegistrations,
  bulkReviewRosterProposals,
  getRegistrationReviewQueue,
} from '../../../features/registration/data/datasources/review-queue';
import { handleApiError } from '../../../lib/apiError';

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
    if (body.kind === 'ROSTER')
      return json(
        await bulkReviewRosterProposals({
          ids: body.ids.map(String),
          action: body.action,
          reviewerId: reviewer.id,
        })
      );
    return json(
      await bulkReviewRegistrations({
        kind: body.kind,
        ids: body.ids.map(String),
        action: body.action,
      })
    );
  } catch (error) {
    return handleApiError(error, 'bulk review registrations', request);
  }
};
