import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';
import { requireAnyPermission } from '../../../features/rbac/middleware';
import { handleApiError } from '../../../lib/apiError';

export const prerender = false;
export const GET: APIRoute = async ({ url, request }) => {
  try {
    await requireAnyPermission(request, ['audit_logs:read', 'players:update', 'teams:update']);
    const page = Math.max(1, Number(url.searchParams.get('page') || 1));
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || 25)));
    const playerId = url.searchParams.get('playerId') || undefined;
    const teamId = url.searchParams.get('teamId') || undefined;
    const db = prisma as any;
    const [audit, notifications] = await Promise.all([
      db.userAuditLog.findMany({ where: playerId ? { metadata: { path: ['playerId'], equals: playerId } } : undefined, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      db.registrationNotification.findMany({ where: { ...(playerId ? { playerId } : {}), ...(teamId ? { teamId } : {}) }, orderBy: { createdAt: 'desc' }, take: limit }),
    ]);
    return new Response(JSON.stringify({ audit, notifications, page, limit }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  } catch (error) { return handleApiError(error, 'fetch activity', request); }
};
