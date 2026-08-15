import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';
import { requirePermission } from '../../../features/rbac/middleware';
import { handleApiError, json } from '../../../lib/apiError';

export const prerender = false;
const PAGE_SIZE = 25;
const SECURITY_ACTIONS = ['AUTH_', 'SETTING_', 'SECURITY_'];

function safeMetadata(metadata: unknown): Record<string, unknown> {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return {};
  return Object.fromEntries(Object.entries(metadata as Record<string, unknown>).filter(([key]) => !/(token|password|secret|hash|code)/i.test(key)));
}

export const GET: APIRoute = async ({ request }) => {
  try {
    await requirePermission(request, 'site_settings:read');
    const url = new URL(request.url);
    const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
    const action = url.searchParams.get('action');
    const where = action && SECURITY_ACTIONS.some((prefix) => action.startsWith(prefix))
      ? { action }
      : { OR: SECURITY_ACTIONS.map((prefix) => ({ action: { startsWith: prefix } })) };
    const [events, total] = await prisma.$transaction([
      prisma.userAuditLog.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, select: { id: true, userId: true, action: true, performedBy: true, metadata: true, createdAt: true } }),
      prisma.userAuditLog.count({ where }),
    ]);
    return json({
      events: events.map((event) => ({ ...event, metadata: safeMetadata(event.metadata) })),
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
    });
  } catch (error) {
    return handleApiError(error, 'list security audit events', request);
  }
};
