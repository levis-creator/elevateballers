import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  findApplications: vi.fn(),
  createPlayer: vi.fn(),
  createConsent: vi.fn(),
  createStaff: vi.fn(),
  createTeam: vi.fn(),
  assignStaffToTeam: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: { $transaction: mocks.transaction },
}));

vi.mock('@/features/cms/lib/mutations', () => ({
  createPlayer: mocks.createPlayer,
  createStaff: mocks.createStaff,
  createTeam: mocks.createTeam,
  assignStaffToTeam: mocks.assignStaffToTeam,
}));

import { approvePendingSeasonRegistrations, submitPlayerRegistration, submitTeamRegistration } from '../public-submission';

describe('public registration transaction limits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findApplications.mockResolvedValue([]);
    mocks.transaction.mockImplementation(async (callback) => callback({
      seasonRegistrationApplication: { findMany: mocks.findApplications },
      teamStaff: { findMany: vi.fn().mockResolvedValue([]) },
      teamOwnership: { findFirst: vi.fn(), create: vi.fn() },
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

describe('a coach who registers several teams', () => {
  const tx = () => ({
    leagueSeason: { findUnique: vi.fn() },
    staff: { findFirst: vi.fn(), update: vi.fn() },
    player: { findMany: vi.fn().mockResolvedValue([]), updateMany: vi.fn() },
    registrationNotification: { create: vi.fn() },
    publicRegistrationSubmission: { create: vi.fn(async ({ data }) => ({ idempotencyKey: data.idempotencyKey })) },
    registrationConsent: { create: vi.fn() },
    publicRegistrationEmailJob: { create: vi.fn(async () => ({ id: 'job-1' })) },
    teamStaff: { findMany: vi.fn() },
    teamOwnership: { findFirst: vi.fn(), create: vi.fn() },
  });
  const input = {
    idempotencyKey: 'key-2',
    name: 'Kilimani Hawks',
    coachName: 'Brian Otieno',
    contactEmail: 'coach@example.com',
    contactPhone: '+254711111111',
    requireApproval: true,
    entryFee: 0,
    consent: { policyVersion: '2026-10-29', consentText: 'I agree to the Privacy Policy.' },
  };
  let db: ReturnType<typeof tx>;

  beforeEach(() => {
    vi.clearAllMocks();
    db = tx();
    mocks.transaction.mockImplementation(async (callback) => callback(db));
    mocks.createTeam.mockResolvedValue({ id: 'team-2', name: 'Kilimani Hawks' });
    mocks.createStaff.mockResolvedValue({ id: 'staff-new' });
  });

  it('links the new team to the existing coach instead of creating another', async () => {
    db.staff.findFirst.mockResolvedValueOnce({ id: 'staff-1', phone: '+254700000000' });
    await submitTeamRegistration(input);
    expect(mocks.createStaff).not.toHaveBeenCalled();
    expect(mocks.assignStaffToTeam).toHaveBeenCalledWith({ teamId: 'team-2', staffId: 'staff-1', role: 'COACH' }, db);
    expect(db.staff.update).not.toHaveBeenCalled();
  });

  it('fills a missing phone number on the existing coach', async () => {
    db.staff.findFirst.mockResolvedValueOnce({ id: 'staff-1', phone: null });
    await submitTeamRegistration(input);
    expect(db.staff.update).toHaveBeenCalledWith({ where: { id: 'staff-1' }, data: { phone: '+254711111111' } });
  });

  it('creates a coach the first time an email is seen', async () => {
    db.staff.findFirst.mockResolvedValue(null);
    await submitTeamRegistration(input);
    expect(mocks.createStaff).toHaveBeenCalledWith(expect.objectContaining({ email: 'coach@example.com', role: 'COACH' }), db);
    expect(mocks.assignStaffToTeam).toHaveBeenCalledWith({ teamId: 'team-2', staffId: 'staff-new', role: 'COACH' }, db);
  });

  it('gives a coach with a portal login access to the newly approved team', async () => {
    mocks.findApplications.mockResolvedValue([]);
    const approval = {
      seasonRegistrationApplication: { findMany: mocks.findApplications },
      teamStaff: { findMany: vi.fn().mockResolvedValue([{ teamId: 'team-2', staff: { userId: 'user-1', email: 'coach@example.com' } }]) },
      teamOwnership: { findFirst: vi.fn().mockResolvedValue(null), create: vi.fn() },
    };
    mocks.transaction.mockImplementation(async (callback) => callback(approval));
    await approvePendingSeasonRegistrations(['team-2']);
    expect(approval.teamOwnership.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ teamId: 'team-2', userId: 'user-1', email: 'coach@example.com', role: 'Team Coach' }),
    });
  });

  it('does not grant portal access twice', async () => {
    const approval = {
      seasonRegistrationApplication: { findMany: vi.fn().mockResolvedValue([]) },
      teamStaff: { findMany: vi.fn().mockResolvedValue([{ teamId: 'team-2', staff: { userId: 'user-1', email: 'coach@example.com' } }]) },
      teamOwnership: { findFirst: vi.fn().mockResolvedValue({ id: 'own-1' }), create: vi.fn() },
    };
    mocks.transaction.mockImplementation(async (callback) => callback(approval));
    await approvePendingSeasonRegistrations(['team-2']);
    expect(approval.teamOwnership.create).not.toHaveBeenCalled();
  });
});
