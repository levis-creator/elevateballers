import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';
import { requireAnyPermission } from '../../../features/rbac/middleware';
import { handleApiError } from '../../../lib/apiError';

export const prerender = false;

function parseNumber(value: string | null, fallback: number) {
  const parsed = value ? parseInt(value, 10) : NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

function endOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

export const GET: APIRoute = async ({ request }) => {
  try {
    await requireAnyPermission(request, ['audit_logs:read', 'audit_logs:manage']);

    const url = new URL(request.url);
    const page = Math.max(1, parseNumber(url.searchParams.get('page'), 1));
    const limit = Math.min(200, Math.max(1, parseNumber(url.searchParams.get('limit'), 25)));
    const search = url.searchParams.get('search')?.trim() || '';
    const metadataSearch = url.searchParams.get('metadataSearch')?.trim() || '';
    const action = url.searchParams.get('action')?.trim() || '';
    const userId = url.searchParams.get('userId')?.trim() || '';
    const performedBy = url.searchParams.get('performedBy')?.trim() || '';
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const cursorCreatedAt = url.searchParams.get('cursorCreatedAt');
    const cursorId = url.searchParams.get('cursorId');

    const andFilters: any[] = [];
    if (action) {
      andFilters.push({ action: { contains: action } });
    }
    if (userId) {
      andFilters.push({ userId });
    }
    if (performedBy) {
      andFilters.push({ performedBy });
    }
    if (from || to) {
      const range: { gte?: Date; lte?: Date } = {};
      if (from) {
        range.gte = new Date(from);
      }
      if (to) {
        range.lte = endOfDay(new Date(to));
      }
      andFilters.push({ createdAt: range });
    }

    if (metadataSearch) {
      const rows = await prisma.$queryRaw<{ id: string }[]>`
        SELECT id
        FROM user_audit_logs
        WHERE MATCH(metadata_text) AGAINST (${metadataSearch} IN BOOLEAN MODE)
      `;
      const ids = rows.map((row) => row.id);
      if (ids.length === 0) {
        return new Response(
          JSON.stringify({ logs: [], page: 1, limit, total: 0, totalPages: 1, nextCursor: null }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      andFilters.push({ id: { in: ids } });
    }

    if (search) {
      const userMatches = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
          ],
        },
        select: { id: true },
      });
      const matchedIds = userMatches.map((u) => u.id);

      const orFilters: any[] = [
        { action: { contains: search } },
        { userId: { contains: search } },
        { performedBy: { contains: search } },
      ];
      if (matchedIds.length) {
        orFilters.push({ userId: { in: matchedIds } });
        orFilters.push({ performedBy: { in: matchedIds } });
      }
      andFilters.push({ OR: orFilters });
    }

    if (cursorCreatedAt && cursorId) {
      const cursorDate = new Date(cursorCreatedAt);
      andFilters.push({
        OR: [
          { createdAt: { lt: cursorDate } },
          { createdAt: cursorDate, id: { lt: cursorId } },
        ],
      });
    }

    const where = andFilters.length ? { AND: andFilters } : undefined;
    const total = await prisma.userAuditLog.count({ where });

    const logs = await prisma.userAuditLog.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: cursorCreatedAt && cursorId ? 0 : (page - 1) * limit,
      take: limit,
    });

    const relatedIds = Array.from(
      new Set(logs.flatMap((log) => [log.userId, log.performedBy]).filter(Boolean))
    );
    const relatedUsers = relatedIds.length
      ? await prisma.user.findMany({
          where: { id: { in: relatedIds } },
          select: { id: true, name: true, email: true },
        })
      : [];
    const userMap = new Map(relatedUsers.map((user) => [user.id, user]));

    const totalPages = Math.max(1, Math.ceil(total / limit));
    const last = logs[logs.length - 1];
    const nextCursor = last
      ? { createdAt: last.createdAt, id: last.id }
      : null;

    return new Response(
      JSON.stringify({
        logs: logs.map((log) => ({
          ...log,
          user: userMap.get(log.userId) || null,
          performedByUser: userMap.get(log.performedBy) || null,
        })),
        page,
        limit,
        total,
        totalPages,
        nextCursor,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return handleApiError(error, 'fetch audit logs', request);
  }
};
