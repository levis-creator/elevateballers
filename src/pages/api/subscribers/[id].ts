import type { APIRoute } from 'astro';
import { requirePermission } from '@/features/rbac/middleware';
import { handleApiError } from '@/lib/apiError';
import { prisma } from '@/lib/prisma';

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

/** Update a subscriber's active state (subscribe/unsubscribe) or name. */
export const PATCH: APIRoute = async ({ request, params }) => {
  try {
    await requirePermission(request, 'subscribers:manage');
    const id = params.id;
    if (!id) return json({ error: 'Missing subscriber id' }, 400);

    let body: any;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON in request body' }, 400);
    }

    const data: { active?: boolean; name?: string | null } = {};
    if (body.active !== undefined) data.active = Boolean(body.active);
    if (body.name !== undefined) data.name = body.name ? String(body.name).slice(0, 120) : null;
    if (Object.keys(data).length === 0) return json({ error: 'Nothing to update' }, 400);

    const subscriber = await prisma.subscriber.update({ where: { id }, data });
    return json(subscriber, 200);
  } catch (error) {
    return handleApiError(error, 'update subscriber', request);
  }
};

/** Permanently delete a subscriber. */
export const DELETE: APIRoute = async ({ request, params }) => {
  try {
    await requirePermission(request, 'subscribers:manage');
    const id = params.id;
    if (!id) return json({ error: 'Missing subscriber id' }, 400);

    try {
      await prisma.subscriber.delete({ where: { id } });
    } catch {
      return json({ ok: true, alreadyDeleted: true }, 200);
    }
    return json({ ok: true }, 200);
  } catch (error) {
    return handleApiError(error, 'delete subscriber', request);
  }
};
