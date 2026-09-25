import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireAnyPermission: vi.fn(),
  bulkReviewRosterProposals: vi.fn(),
  notifyCoachesOfRosterDecisions: vi.fn(),
  logAudit: vi.fn(),
}));

vi.mock('../../../../features/rbac/middleware', () => ({ requireAnyPermission: mocks.requireAnyPermission }));
vi.mock('../../../../features/registration/data/datasources/review-queue', () => ({
  bulkReviewRegistrations: vi.fn(),
  bulkReviewRosterProposals: mocks.bulkReviewRosterProposals,
  getRegistrationReviewQueue: vi.fn(),
}));
vi.mock('../../../../features/cms/lib/audit', () => ({ logAudit: mocks.logAudit }));
vi.mock('../../../../features/registration/application/roster-request-emails', () => ({
  notifyCoachesOfRosterDecisions: mocks.notifyCoachesOfRosterDecisions,
}));

import { POST } from '../review-queue';

const decision = (playerId: string, type: string, approved: boolean) => ({
  rosterId: `r-${playerId}`,
  playerId,
  type,
  approved,
  playerName: playerId,
  teamId: 'team-1',
  teamName: 'Queens',
  coachId: 'coach-1',
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAnyPermission.mockResolvedValue({ id: 'admin-1' });
});

describe('POST /api/registration/review-queue (roster)', () => {
  it("logs each decision against its player so it shows in that player's activity", async () => {
    const decisions = [decision('p1', 'DROPOUT', true), decision('p2', 'REMOVAL', true)];
    mocks.bulkReviewRosterProposals.mockResolvedValue({ count: 2, decisions });
    const request = new Request('https://example.test/api/registration/review-queue', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ kind: 'ROSTER', ids: ['r-p1', 'r-p2'], action: 'APPROVE' }),
    });
    const response = await POST({ request } as any);
    expect(response.status).toBe(200);
    expect(mocks.logAudit.mock.calls.map((call) => [call[1], call[2].playerId, call[2].type])).toEqual([
      ['ROSTER_REQUEST_APPROVED', 'p1', 'DROPOUT'],
      ['ROSTER_REQUEST_APPROVED', 'p2', 'REMOVAL'],
    ]);
    expect(mocks.notifyCoachesOfRosterDecisions).toHaveBeenCalledWith(decisions);
  });
});
