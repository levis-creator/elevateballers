import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/features/rbac/middleware';
import { requireSystemAdmin } from '@/features/rbac/auth-helpers';
import { handleApiError, json } from '@/lib/apiError';
import { writeAuditLog } from '@/features/cms/lib/auth';

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'staff:read');
    const staff = await prisma.staff.findUnique({ where: { id: params.id! }, select: { userId: true } });
    if (!staff) return json({ error: 'Staff member not found' }, 404);
    if (!staff.userId) return json({ sessions: [] }, 200);
    const sessions = await prisma.userSession.findMany({
      where: { userId: staff.userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: [{ lastSeenAt: 'desc' }, { createdAt: 'desc' }],
      select: { id: true, createdAt: true, lastSeenAt: true, expiresAt: true },
    });
    return json({ sessions }, 200);
  } catch (error) {
    return handleApiError(error, 'fetch staff sessions', request);
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    const actor = await requireSystemAdmin(request);
    const sessionId = new URL(request.url).searchParams.get('sessionId');
    if (!sessionId) return json({ error: 'Session id is required' }, 400);
    const staff = await prisma.staff.findUnique({ where: { id: params.id! }, select: { userId: true } });
    const session = await prisma.userSession.findUnique({ where: { id: sessionId }, select: { id: true, userId: true, revokedAt: true } });
    if (!staff || !session || !staff.userId || session.userId !== staff.userId) return json({ error: 'Session not found' }, 404);
    if (!session.revokedAt) await prisma.userSession.update({ where: { id: session.id }, data: { revokedAt: new Date(), revokeReason: 'staff_detail_admin_revoked' } });
    await writeAuditLog(session.userId, 'AUTH_SESSION_REVOKED', actor.id, { sessionId: session.id, staffId: params.id });
    return json({ message: 'Session revoked' }, 200);
  } catch (error) {
    return handleApiError(error, 'revoke staff session', request);
  }
};
