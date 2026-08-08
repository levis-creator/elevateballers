import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  findApplications: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: { $transaction: mocks.transaction },
}));

vi.mock('@/features/cms/lib/mutations', () => ({
  createPlayer: vi.fn(),
  createStaff: vi.fn(),
  createTeam: vi.fn(),
  assignStaffToTeam: vi.fn(),
}));

import { approvePendingSeasonRegistrations } from '../public-submission';

describe('public registration transaction limits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findApplications.mockResolvedValue([]);
    mocks.transaction.mockImplementation(async (callback) => callback({
      seasonRegistrationApplication: { findMany: mocks.findApplications },
    }));
  });

  it('uses a serverless-safe interactive transaction timeout', async () => {
    await expect(approvePendingSeasonRegistrations(['team-1'])).resolves.toBe(0);
    expect(mocks.transaction).toHaveBeenCalledWith(
      expect.any(Function),
      { maxWait: 10_000, timeout: 30_000 },
    );
  });
});
