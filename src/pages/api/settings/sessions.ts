import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';
import { requirePermission } from '../../../features/rbac/middleware';
import { writeAuditLog } from '../../../features/cms/lib/auth';
import { handleApiError, json } from '../../../lib/apiError';
import { enforceRateLimit } from '../../../lib/rateLimit';

export const prerender = false;

const PAGE_SIZE = 20;

export const GET: APIRoute = async ({ request }) => {
  try {
    await requirePermission(request, 'site_settings:read');
    const url = new URL(request.url);
    const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
    const status = url.searchParams.get('status');
    const where = status === 'active'
      ? { revokedAt: null, expiresAt: { gt: new Date() } }
      : status === 'revoked'
        ? { revokedAt: { not: null } }
        : status === 'expired'
          ? { revokedAt: null, expiresAt: { lte: new Date() } }
          : {};

    const [sessions, total] = await prisma.$transaction([
      prisma.userSession.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          createdAt: true,
          lastSeenAt: true,
          expiresAt: true,
          revokedAt: true,
          revokeReason: true,
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.userSession.count({ where }),
    ]);

    return json({
      sessions: sessions.map((session) => ({
        id: session.id,
        user: session.user,
        createdAt: session.createdAt,
        lastSeenAt: session.lastSeenAt,
        expiresAt: session.expiresAt,
        revokedAt: session.revokedAt,
        revokeReason: session.revokeReason,
        status: session.revokedAt ? 'revoked' : session.expiresAt <= new Date() ? 'expired' : 'active',
      })),
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
      durableOnly: true,
    });
  } catch (error) {
    return handleApiError(error, 'list sessions', request);
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const actor = await requirePermission(request, 'site_settings:manage');
    const limited = await enforceRateLimit(
      `settings:${actor.id}:revoke-session`,
      30,
      15 * 60 * 1000,
      'Too many session revocations. Please try again shortly.',
    );
    if (limited) return limited;

    const sessionId = new URL(request.url).searchParams.get('id');
    if (!sessionId) return json({ error: 'Session id is required' }, 400);
    const session = await prisma.userSession.findUnique({
      where: { id: sessionId },
      select: { id: true, userId: true, revokedAt: true },
    });
    if (!session) return json({ error: 'Session not found' }, 404);
    if (session.revokedAt) return json({ message: 'Session is already revoked' }, 200);

    await prisma.userSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date(), revokeReason: 'admin_revoked' },
    });
    await writeAuditLog(session.userId, 'AUTH_SESSION_REVOKED', actor.id, {
      sessionId: session.id,
      reason: 'admin_revoked',
    });
    return json({ message: 'Session revoked' }, 200);
  } catch (error) {
    return handleApiError(error, 'revoke session', request);
  }
};
