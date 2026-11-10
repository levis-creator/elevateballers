import type { APIRoute } from 'astro';
import { requireAnyPermission } from '../../../features/rbac/middleware';
import {
  exportRegistrationReviewQueue,
  reviewQueueFiltersFromUrl,
} from '../../../features/registration/data/datasources/review-queue';
import { handleApiError } from '../../../lib/apiError';
import { csvDateStamp, csvResponse } from '../../../lib/csv';

export const prerender = false;

const fullName = (person: any) => `${person?.firstName || ''} ${person?.lastName || ''}`.trim();

function registrationStatus(row: any) {
  if (row.approved) return 'APPROVED';
  return row.reviewStatus || 'PENDING';
}

/** Every registration matching the queue filters; no row cap. */
export const GET: APIRoute = async ({ url, request }) => {
  try {
    await requireAnyPermission(request, ['players:update', 'teams:update']);
    const data = await exportRegistrationReviewQueue(reviewQueueFiltersFromUrl(url));
    const rows: unknown[][] = [
      ['kind', 'id', 'name', 'email', 'phone', 'status', 'team', 'league', 'season', 'request', 'submitted', 'review notes'],
      ...data.players.map((p) => [
        'PLAYER', p.id, fullName(p), p.email, p.phone, registrationStatus(p), p.team?.name, '', '', 'New player', p.createdAt, p.reviewNotes,
      ]),
      ...data.teams.map((t) => [
        'TEAM', t.id, t.name, t.contactEmail, '', registrationStatus(t), t.name, '', '', 'New team', t.createdAt, t.reviewNotes,
      ]),
      ...data.rosterProposals.map((r) => [
        'ROSTER', r.id, fullName(r.player), r.player?.email, r.player?.phone, r.status, r.team?.name,
        r.leagueSeason?.league?.name, r.leagueSeason?.season?.name, r.requestType, r.createdAt, r.history?.[0]?.reason,
      ]),
    ];
    return csvResponse(rows, `registrations-${csvDateStamp()}.csv`);
  } catch (error) {
    return handleApiError(error, 'export registration review queue', request);
  }
};
