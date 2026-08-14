import type { APIRoute } from 'astro';
import { requirePermission } from '../../../features/rbac/middleware';
import { handleApiError } from '../../../lib/apiError';
import { prisma } from '../../../lib/prisma';

export const prerender = false;

const ACTIONS = ['EMAIL_SENT', 'EMAIL_FAILED', 'EMAIL_OPENED', 'EMAIL_BOUNCED'];
const STATUS_BY_ACTION: Record<string, string> = { EMAIL_SENT: 'Sent', EMAIL_FAILED: 'Failed', EMAIL_OPENED: 'Opened', EMAIL_BOUNCED: 'Bounced' };
const statusFor = (action: string) => STATUS_BY_ACTION[action] ?? 'Queued';

export const GET: APIRoute = async ({ request }) => {
  try {
    await requirePermission(request, 'site_settings:read');
    const requested = Number(new URL(request.url).searchParams.get('limit') || 6);
    const limit = Math.min(20, Math.max(1, Number.isFinite(requested) ? requested : 6));
    const where = { action: { in: ACTIONS } };
    const [logs, total] = await Promise.all([
      prisma.userAuditLog.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit }),
      prisma.userAuditLog.count({ where }),
    ]);
    const rows = logs.map((log) => {
      const metadata = log.metadata && typeof log.metadata === 'object' && !Array.isArray(log.metadata)
        ? log.metadata as Record<string, unknown>
        : {};
      return {
        id: log.id,
        createdAt: log.createdAt,
        template: String(metadata.template || 'transactional_email'),
        provider: String(metadata.provider || ''),
        recipient: metadata.toHash ? `•••• ${String(metadata.toHash).slice(-8)}` : 'Recipient protected',
        status: statusFor(log.action),
      };
    });
    return new Response(JSON.stringify({ rows, total }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handleApiError(error, 'fetch email history', request);
  }
};
