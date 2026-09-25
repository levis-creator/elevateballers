import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const prisma: any = {};
  prisma.$transaction = vi.fn((fn: (tx: any) => unknown) => fn(prisma));
  return {
    prisma,
    requirePermission: vi.fn(),
    logAudit: vi.fn(),
    dropOutPlayer: vi.fn(),
    reinstatePlayer: vi.fn(),
  };
});

vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }));
vi.mock('@/features/rbac/middleware', () => ({ requirePermission: mocks.requirePermission }));
vi.mock('@/features/cms/lib/audit', () => ({ logAudit: mocks.logAudit }));
vi.mock('@/features/player/data/datasources/dropout-repository', () => ({
  dropOutPlayer: mocks.dropOutPlayer,
  reinstatePlayer: mocks.reinstatePlayer,
}));

import { POST } from '../bulk-dropout';

class RosterDropoutError extends Error {
  name = 'RosterDropoutError';
}

const post = (body: unknown) =>
  POST({
    request: new Request('https://example.test/api/players/bulk-dropout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
  } as any);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requirePermission.mockResolvedValue({ id: 'admin-1' });
});

describe('POST /api/players/bulk-dropout', () => {
  it('drops out each player, reporting the ones that cannot change', async () => {
    mocks.dropOutPlayer.mockImplementation(async (_tx: unknown, playerId: string) => {
      if (playerId === 'p2') throw new RosterDropoutError('This player is not on any active roster.');
      return [{ id: `r-${playerId}`, teamId: 'team-1' }];
    });
    const response = await post({ ids: ['p1', 'p2'], action: 'DROP_OUT', reason: 'Relocated' });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      done: ['p1'],
      skipped: [{ id: 'p2', error: 'This player is not on any active roster.' }],
    });
    expect(mocks.dropOutPlayer).toHaveBeenCalledWith(mocks.prisma, 'p1', { reason: 'Relocated', changedById: 'admin-1' });
    expect(mocks.logAudit).toHaveBeenCalledTimes(1);
    expect(mocks.logAudit.mock.calls[0][1]).toBe('PLAYER_DROPPED_OUT');
    expect(mocks.logAudit.mock.calls[0][2]).toMatchObject({ playerId: 'p1', rosterId: 'r-p1', reason: 'Relocated' });
  });

  it('reinstates players', async () => {
    mocks.reinstatePlayer.mockResolvedValue({ id: 'r-p1', teamId: 'team-1' });
    const body = await (await post({ ids: ['p1'], action: 'REINSTATE' })).json();
    expect(body).toEqual({ done: ['p1'], skipped: [] });
    expect(mocks.logAudit.mock.calls[0][1]).toBe('PLAYER_REINSTATED');
  });

  it('rejects an empty selection', async () => {
    expect((await post({ ids: [], action: 'DROP_OUT' })).status).toBe(400);
  });

  it('requires players:update', async () => {
    mocks.requirePermission.mockRejectedValue(new Error('Forbidden: players:update'));
    expect((await post({ ids: ['p1'], action: 'DROP_OUT' })).status).toBe(403);
    expect(mocks.dropOutPlayer).not.toHaveBeenCalled();
  });
});
