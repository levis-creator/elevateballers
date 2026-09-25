import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireRosterScopedPermission: vi.fn(),
  logAudit: vi.fn(),
  useCases: {
    approveRosterPlayer: vi.fn(),
    rejectRosterPlayer: vi.fn(),
    withdrawRosterPlayer: vi.fn(),
  },
}));

vi.mock('../../../../features/rbac/middleware', () => ({
  requireRosterScopedPermission: mocks.requireRosterScopedPermission,
}));
vi.mock('../../../../features/cms/lib/audit', () => ({ logAudit: mocks.logAudit }));
vi.mock('../../../../features/registration/data/datasources/season-registration', () => ({
  createPrismaSeasonRegistrationRepository: () => ({}),
}));
vi.mock('../../../../features/registration/domain/usecases/season-registration', () => ({
  createSeasonRegistrationUseCases: () => mocks.useCases,
}));

import { PATCH } from '../[id]';

const patch = (body: unknown) =>
  PATCH({
    params: { id: 'r1' },
    request: new Request('https://site.test/api/season-rosters/r1', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
  } as any);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireRosterScopedPermission.mockResolvedValue({ id: 'admin-7' });
  for (const fn of Object.values(mocks.useCases)) fn.mockResolvedValue({ id: 'r1', playerId: 'p1', teamId: 't1' });
});

describe('PATCH /api/season-rosters/[id]', () => {
  it('attributes the decision to the signed-in reviewer, not the request body', async () => {
    await patch({ status: 'APPROVED', reviewerId: 'someone-else' });
    expect(mocks.useCases.approveRosterPlayer).toHaveBeenCalledWith('r1', 'admin-7');
    expect(mocks.logAudit).toHaveBeenCalledWith(expect.any(Request), 'SEASON_ROSTER_APPROVED', {
      rosterId: 'r1',
      playerId: 'p1',
      teamId: 't1',
    });
  });

  it.each([
    ['REJECTED', 'rejectRosterPlayer', 'SEASON_ROSTER_REJECTED'],
    ['WITHDRAWN', 'withdrawRosterPlayer', 'SEASON_ROSTER_WITHDRAWN'],
  ] as const)('logs a %s decision', async (status, method, action) => {
    await patch({ status });
    expect(mocks.useCases[method]).toHaveBeenCalledWith('r1', 'admin-7');
    expect(mocks.logAudit).toHaveBeenCalledWith(expect.any(Request), action, expect.any(Object));
  });

  it('does not log when the reviewer lacks permission', async () => {
    mocks.requireRosterScopedPermission.mockRejectedValue(new Error('Forbidden: not your team'));
    expect((await patch({ status: 'APPROVED' })).status).toBe(403);
    expect(mocks.logAudit).not.toHaveBeenCalled();
  });
});
