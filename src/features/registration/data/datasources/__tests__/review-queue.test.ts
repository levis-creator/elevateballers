import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const prisma: any = {
    seasonTeamPlayer: { findMany: vi.fn(), update: vi.fn() },
    seasonRosterHistory: { createMany: vi.fn() },
  };
  prisma.$transaction = vi.fn((fn: (tx: any) => unknown) => fn(prisma));
  return { prisma };
});

vi.mock('../../../../../lib/prisma', () => ({ prisma: mocks.prisma }));

import { bulkReviewRosterProposals } from '../review-queue';

const row = (id: string, status: string, latestProposal: string) => ({
  id,
  status,
  leagueSeasonId: 'ls-1',
  seasonTeamId: 'st-1',
  teamId: 'team-1',
  playerId: `player-${id}`,
  history: [{ action: latestProposal }],
});

/** First findMany: pending-removal candidates. Second: the rows to review. */
function queue(removalCandidates: any[], rows: any[]) {
  mocks.prisma.seasonTeamPlayer.findMany
    .mockResolvedValueOnce(removalCandidates)
    .mockResolvedValueOnce(rows);
}

const recorded = () =>
  mocks.prisma.seasonRosterHistory.createMany.mock.calls[0][0].data.map((d: any) => [d.rosterId, d.action]);

beforeEach(() => vi.clearAllMocks());

describe('bulkReviewRosterProposals', () => {
  it('rejecting an edit keeps the player on the roster', async () => {
    queue([], [row('r1', 'PENDING', 'ROSTER_EDIT_PROPOSED')]);
    await bulkReviewRosterProposals({ ids: ['r1'], action: 'REJECT', reviewerId: 'admin' });
    expect(mocks.prisma.seasonTeamPlayer.update).toHaveBeenCalledWith({
      where: { id: 'r1' },
      data: { status: 'APPROVED', leftAt: null },
    });
    expect(recorded()).toEqual([['r1', 'ROSTER_EDIT_REJECTED']]);
  });

  it('rejecting a new player proposal removes them', async () => {
    queue([], [row('r1', 'PENDING', 'ROSTER_PROPOSED')]);
    await bulkReviewRosterProposals({ ids: ['r1'], action: 'REJECT', reviewerId: 'admin' });
    expect(mocks.prisma.seasonTeamPlayer.update).toHaveBeenCalledWith({
      where: { id: 'r1' },
      data: { status: 'REJECTED', leftAt: expect.any(Date) },
    });
    expect(recorded()).toEqual([['r1', 'ROSTER_REJECTED']]);
  });

  it('approving a pending removal withdraws the player', async () => {
    queue(
      [{ id: 'r1', history: [{ action: 'ROSTER_REMOVAL_PROPOSED' }] }],
      [row('r1', 'APPROVED', 'ROSTER_REMOVAL_PROPOSED')]
    );
    await bulkReviewRosterProposals({ ids: ['r1'], action: 'APPROVE', reviewerId: 'admin' });
    expect(mocks.prisma.seasonTeamPlayer.update).toHaveBeenCalledWith({
      where: { id: 'r1' },
      data: { status: 'WITHDRAWN', leftAt: expect.any(Date) },
    });
    expect(recorded()).toEqual([['r1', 'ROSTER_REMOVAL_APPROVED']]);
  });

  it('ignores removal requests that were already decided', async () => {
    queue([{ id: 'r1', history: [{ action: 'ROSTER_REMOVAL_REJECTED' }] }], []);
    const result = await bulkReviewRosterProposals({ ids: ['r1'], action: 'APPROVE', reviewerId: 'admin' });
    expect(result).toEqual({ count: 0 });
    expect(mocks.prisma.seasonTeamPlayer.findMany.mock.calls[1][0].where.OR).toEqual([
      { status: 'PENDING' },
      { id: { in: [] } },
    ]);
  });
});
