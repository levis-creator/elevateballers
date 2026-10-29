import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  findApplications: vi.fn(),
  createPlayer: vi.fn(),
  createConsent: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: { $transaction: mocks.transaction },
}));

vi.mock('@/features/cms/lib/mutations', () => ({
  createPlayer: mocks.createPlayer,
  createStaff: vi.fn(),
  createTeam: vi.fn(),
  assignStaffToTeam: vi.fn(),
}));

import { approvePendingSeasonRegistrations, submitPlayerRegistration } from '../public-submission';

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

describe('registration consent record', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createPlayer.mockResolvedValue({ id: 'player-1' });
    mocks.createConsent.mockResolvedValue({ id: 'consent-1' });
    let job = 0;
    mocks.transaction.mockImplementation(async (callback) => callback({
      registrationNotification: { create: vi.fn() },
      publicRegistrationSubmission: {
        create: vi.fn(async ({ data }) => ({ idempotencyKey: data.idempotencyKey })),
      },
      registrationConsent: { create: mocks.createConsent },
      publicRegistrationEmailJob: { create: vi.fn(async () => ({ id: `job-${++job}` })) },
    }));
  });

  it('saves the accepted policy version and wording with the player registration', async () => {
    await submitPlayerRegistration({
      idempotencyKey: 'key-1',
      firstName: 'Asha',
      lastName: 'Wanjiku',
      email: 'asha@example.com',
      phone: '+254700000000',
      position: 'PG',
      requireApproval: true,
      entryFee: 0,
      consent: { policyVersion: '2026-10-29', consentText: 'I agree to the Privacy Policy.' },
    });
    expect(mocks.createConsent).toHaveBeenCalledWith({
      data: {
        kind: 'PLAYER',
        entityId: 'player-1',
        email: 'asha@example.com',
        submissionKey: 'key-1',
        policyVersion: '2026-10-29',
        consentText: 'I agree to the Privacy Policy.',
      },
    });
  });
});
