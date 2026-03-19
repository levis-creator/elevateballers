import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';
import { requirePermission } from '../../../features/rbac/middleware';

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

function escapeCsv(value: unknown) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export const GET: APIRoute = async ({ request }) => {
  try {
    await requirePermission(request, 'audit_logs:manage');

    const url = new URL(request.url);
    const format = (url.searchParams.get('format') || 'csv').toLowerCase();
    const limit = Math.min(5000, Math.max(1, parseNumber(url.searchParams.get('limit'), 5000)));
    const search = url.searchParams.get('search')?.trim() || '';
    const metadataSearch = url.searchParams.get('metadataSearch')?.trim() || '';
    const action = url.searchParams.get('action')?.trim() || '';
    const userId = url.searchParams.get('userId')?.trim() || '';
    const performedBy = url.searchParams.get('performedBy')?.trim() || '';
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');

    const andFilters: any[] = [];
    if (action) {
      andFilters.push({ action: { contains: action, mode: 'insensitive' } });
    }
    if (userId) {
      andFilters.push({ userId });
    }
    if (performedBy) {
      andFilters.push({ performedBy });
    }
    if (from || to) {
      const range: { gte?: Date; lte?: Date } = {};
      if (from) range.gte = new Date(from);
      if (to) range.lte = endOfDay(new Date(to));
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
        return new Response('id,action,user_id,performed_by,created_at,metadata\n', {
          status: 200,
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': 'attachment; filename="audit-logs.csv"',
          },
        });
      }
      andFilters.push({ id: { in: ids } });
    }

    if (search) {
      const userMatches = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        },
        select: { id: true },
      });
      const matchedIds = userMatches.map((u) => u.id);

      const orFilters: any[] = [
        { action: { contains: search, mode: 'insensitive' } },
        { userId: { contains: search } },
        { performedBy: { contains: search } },
      ];
      if (matchedIds.length) {
        orFilters.push({ userId: { in: matchedIds } });
        orFilters.push({ performedBy: { in: matchedIds } });
      }
      andFilters.push({ OR: orFilters });
    }

    const where = andFilters.length ? { AND: andFilters } : undefined;

    const logs = await prisma.userAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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

    const enrichedLogs = logs.map((log) => ({
      ...log,
      user: userMap.get(log.userId) || null,
      performedByUser: userMap.get(log.performedBy) || null,
    }));

    if (format === 'json') {
      return new Response(JSON.stringify(enrichedLogs), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': 'attachment; filename="audit-logs.json"',
        },
      });
    }

    const header = [
      'id',
      'action',
      'user_id',
      'user_name',
      'user_email',
      'performed_by',
      'performed_by_name',
      'performed_by_email',
      'created_at',
      'metadata',
    ];

    const rows = enrichedLogs.map((log) => [
      escapeCsv(log.id),
      escapeCsv(log.action),
      escapeCsv(log.userId),
      escapeCsv(log.user?.name || ''),
      escapeCsv(log.user?.email || ''),
      escapeCsv(log.performedBy),
      escapeCsv(log.performedByUser?.name || ''),
      escapeCsv(log.performedByUser?.email || ''),
      escapeCsv(log.createdAt?.toISOString?.() || log.createdAt),
      escapeCsv(log.metadata ? JSON.stringify(log.metadata) : ''),
    ]);

    const csv = [header.map(escapeCsv).join(','), ...rows.map((r) => r.join(','))].join('\n');

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="audit-logs.csv"',
      },
    });
  } catch (error: any) {
    console.error('Export audit logs error:', error);
    const message = error?.message || 'Failed to export audit logs';

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
