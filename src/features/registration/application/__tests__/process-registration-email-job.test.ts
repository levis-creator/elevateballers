import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const jobs = new Map<string, any>();
  const job = {
    findUnique: vi.fn(async ({ where }: any) => jobs.get(where.id) ?? null),
    findMany: vi.fn(async (_args: any) => [...jobs.values()].map(({ id }) => ({ id }))),
    updateMany: vi.fn(async ({ where, data }: any) => {
      const row = jobs.get(where.id);
      if (!row || !['PENDING', 'FAILED', 'PROCESSING'].includes(row.status)) return { count: 0 };
      jobs.set(where.id, { ...row, status: data.status, attempts: row.attempts + 1 });
      return { count: 1 };
    }),
    update: vi.fn(async ({ where, data }: any) => {
      jobs.set(where.id, { ...jobs.get(where.id), ...data });
    }),
  };
  return {
    jobs,
    prisma: { publicRegistrationEmailJob: job },
    sendTeamRegistrationAutoReply: vi.fn(),
    sendPlayerRegistrationAutoReply: vi.fn(),
    sendAdminNotificationEmail: vi.fn(),
  };
});

vi.mock('../../../../lib/prisma', () => ({ prisma: mocks.prisma }));
vi.mock('../../../../lib/email', () => ({
  sendTeamRegistrationAutoReply: mocks.sendTeamRegistrationAutoReply,
  sendPlayerRegistrationAutoReply: mocks.sendPlayerRegistrationAutoReply,
  sendAdminNotificationEmail: mocks.sendAdminNotificationEmail,
}));
vi.mock('../../../settings', () => ({
  siteSettingsService: { list: vi.fn(async () => []) },
  resolveEmailDeliverySettings: () => ({ retries: 3 }),
}));

import { retryRegistrationEmailJobs } from '../process-registration-email-job';

const addJob = (id: string, status: string, attempts: number) =>
  mocks.jobs.set(id, { id, status, attempts, payload: { jobType: 'team_registration_auto_reply', data: { id } } });

describe('retryRegistrationEmailJobs', () => {
  beforeEach(() => {
    mocks.jobs.clear();
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('only asks for failed, stale pending and expired-lock jobs', async () => {
    const now = new Date('2026-11-03T12:00:00Z');
    await retryRegistrationEmailJobs(now);
    const { where } = mocks.prisma.publicRegistrationEmailJob.findMany.mock.calls[0][0];
    expect(where.OR).toEqual([
      { status: 'FAILED' },
      { status: 'PENDING', createdAt: { lt: new Date('2026-11-03T11:50:00Z') } },
      { status: 'PROCESSING', lockedUntil: { lt: now } },
    ]);
  });

  it('resends a failed job and marks it sent', async () => {
    addJob('a', 'FAILED', 1);
    expect(await retryRegistrationEmailJobs()).toEqual({ sent: 1, failed: 0 });
    expect(mocks.sendTeamRegistrationAutoReply).toHaveBeenCalledWith({ id: 'a' });
    expect(mocks.jobs.get('a').status).toBe('SENT');
  });

  it('keeps a job failed when the resend fails, without stopping the batch', async () => {
    addJob('a', 'FAILED', 1);
    addJob('b', 'FAILED', 1);
    mocks.sendTeamRegistrationAutoReply.mockRejectedValueOnce(new Error('SMTP down'));
    expect(await retryRegistrationEmailJobs()).toEqual({ sent: 1, failed: 1 });
    expect(mocks.jobs.get('a')).toMatchObject({ status: 'FAILED', attempts: 2, lastError: 'SMTP down' });
    expect(mocks.jobs.get('b').status).toBe('SENT');
  });

  it('gives up on a job that has used every attempt', async () => {
    addJob('a', 'FAILED', 4);
    expect(await retryRegistrationEmailJobs()).toEqual({ sent: 0, failed: 0 });
    expect(mocks.sendTeamRegistrationAutoReply).not.toHaveBeenCalled();
    expect(mocks.jobs.get('a').status).toBe('EXHAUSTED');
  });
});
