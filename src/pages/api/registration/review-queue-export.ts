import type { APIRoute } from 'astro';
import { requireAnyPermission } from '../../../features/rbac/middleware';
import { getRegistrationReviewQueue } from '../../../features/registration/data/datasources/review-queue';
import { handleApiError } from '../../../lib/apiError';

export const prerender = false;
const csv = (value: unknown) => { const s = String(value ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
export const GET: APIRoute = async ({ url, request }) => {
  try {
    await requireAnyPermission(request, ['players:update', 'teams:update']);
    const data = await getRegistrationReviewQueue({ page: 1, limit: 100, kind: url.searchParams.get('kind') || undefined, status: url.searchParams.get('status') || undefined, search: url.searchParams.get('search') || undefined });
    const rows = [
      ['kind', 'id', 'name', 'email', 'approved', 'team'],
      ...data.players.map((p: any) => ['PLAYER', p.id, `${p.firstName || ''} ${p.lastName || ''}`.trim(), p.email, p.approved, p.team?.name || '']),
      ...data.teams.map((t: any) => ['TEAM', t.id, t.name, t.contactEmail, t.approved, t.name]),
    ];
    return new Response(rows.map((row) => row.map(csv).join(',')).join('\n'), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="registration-review-queue.csv"' } });
  } catch (error) { return handleApiError(error, 'export registration review queue', request); }
};
