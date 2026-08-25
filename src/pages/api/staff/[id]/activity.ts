import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/features/rbac/middleware';
import { handleApiError, json } from '@/lib/apiError';

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'staff:read');
    const staff = await prisma.staff.findUnique({ where: { id: params.id! }, select: { id: true, userId: true } });
    if (!staff) return json({ error: 'Staff member not found' }, 404);
    const logs = await prisma.userAuditLog.findMany({
      where: { OR: [{ metadata: { path: 'staffId', equals: staff.id } }, ...(staff.userId ? [{ userId: staff.userId }, { metadata: { path: 'userId', equals: staff.userId } }] : [])] },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 100,
    });
    const actorIds = Array.from(new Set(logs.map((log) => log.performedBy).filter(Boolean)));
    const actors = actorIds.length ? await prisma.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, name: true, email: true } }) : [];
    const actorMap = new Map(actors.map((actor) => [actor.id, actor]));
    return json({ events: logs.map((log) => ({ ...log, actor: actorMap.get(log.performedBy) ?? null })) }, 200);
  } catch (error) {
    return handleApiError(error, 'fetch staff activity', request);
  }
};
