import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';
import { requireAnyPermission } from '../../../features/rbac/middleware';

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
  } catch (error: any) {
    console.error('Get audit log actions error:', error);
    const message = error?.message || 'Failed to fetch audit log actions';

    if (message.includes('Unauthorized')) {
      return new Response(JSON.stringify({ error: message }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (message.includes('Forbidden')) {
      return new Response(JSON.stringify({ error: message }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
