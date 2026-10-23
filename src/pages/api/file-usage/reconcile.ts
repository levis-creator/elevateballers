import type { APIRoute } from 'astro';
import { requirePermission } from '../../../features/rbac/middleware';
import { reconcileFileUsage } from '../../../lib/file-usage';
import { handleApiError } from '../../../lib/apiError';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    await requirePermission(request, 'media:manage');
    return new Response(JSON.stringify({ ok: true, ...(await reconcileFileUsage()) }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return handleApiError(error, 'reconcile media usage', request);
  }
};
