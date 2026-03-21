import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';
import { requireAnyPermission } from '../../../features/rbac/middleware';
import { handleApiError } from '../../../lib/apiError';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    await requireAnyPermission(request, ['audit_logs:read', 'audit_logs:manage']);

    const actions = await prisma.userAuditLog.groupBy({
      by: ['action'],
      _count: { action: true },
      orderBy: { _count: { action: 'desc' } },
    });

    return new Response(
      JSON.stringify({
        actions: actions.map((item) => ({
          action: item.action,
          count: item._count.action,
        })),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return handleApiError(error, 'fetch audit log actions', request);
  }
};
