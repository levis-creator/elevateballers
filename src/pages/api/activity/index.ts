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
    // Name who did each audited action (performedBy is the signed-in actor).
    const actorIds = [...new Set(audit.map((row: any) => row.performedBy).filter(Boolean))];
    const actors = actorIds.length
      ? await db.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, name: true, email: true } })
      : [];
    const actorById = new Map(actors.map((user: any) => [user.id, user.name || user.email]));
    const auditWithActors = audit.map((row: any) => ({ ...row, actor: actorById.get(row.performedBy) ?? (row.performedBy === 'system' ? 'System' : null) }));
    return new Response(JSON.stringify({ audit: auditWithActors, notifications, page, limit }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  } catch (error) { return handleApiError(error, 'fetch activity', request); }
};
