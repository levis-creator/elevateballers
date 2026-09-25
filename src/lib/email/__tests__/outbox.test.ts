import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  prisma: {
    emailOutbox: { create: vi.fn(), findMany: vi.fn(), updateMany: vi.fn(), update: vi.fn(), deleteMany: vi.fn() },
  },
  runEmailJob: vi.fn(),
  logAuditSystem: vi.fn(),
}));

vi.mock('../../prisma', () => ({ prisma: mocks.prisma }));
vi.mock('../../../features/cms/lib/audit', () => ({ logAuditSystem: mocks.logAuditSystem }));
vi.mock('../jobs', () => {
  class InvalidEmailJobError extends Error {}
  return { InvalidEmailJobError, runEmailJob: mocks.runEmailJob };
});

import { enqueueFailedEmail, outboxBackoffHours, OUTBOX_MAX_ATTEMPTS } from '../outbox';
import { processEmailOutbox } from '../outbox-processor';
import { InvalidEmailJobError } from '../jobs';

const NOW = new Date('2026-09-25T10:00:00Z');
const HOUR = 3_600_000;
const row = (attempts = 0) => ({ id: 'o1', payload: { jobType: 'admin_notification', data: {} }, attempts });
const lastUpdate = () => mocks.prisma.emailOutbox.update.mock.calls.at(-1)![0];

beforeEach(() => {
  vi.clearAllMocks();
  mocks.prisma.emailOutbox.findMany.mockResolvedValue([row()]);
  mocks.prisma.emailOutbox.updateMany.mockResolvedValue({ count: 1 });
  mocks.prisma.emailOutbox.deleteMany.mockResolvedValue({ count: 0 });
  mocks.prisma.emailOutbox.create.mockResolvedValue({ id: 'o9' });
});

describe('enqueueFailedEmail', () => {
  it('stores the job with its error and a first retry an hour out', async () => {
    vi.useFakeTimers({ now: NOW });
    expect(await enqueueFailedEmail({ jobType: 'roster_decision', data: {} }, new Error('smtp down'), 'inline')).toBe(true);
    expect(mocks.prisma.emailOutbox.create).toHaveBeenCalledWith({
      data: {
        payload: { jobType: 'roster_decision', data: {} },
        source: 'inline',
        lastError: 'smtp down',
        nextAttemptAt: new Date(NOW.getTime() + HOUR),
      },
      select: { id: true },
    });
    expect(mocks.logAuditSystem).toHaveBeenCalledWith('EMAIL_QUEUED_FOR_RETRY', {
      outboxId: 'o9',
      source: 'inline',
      jobType: 'roster_decision',
      error: 'smtp down',
    });
    vi.useRealTimers();
  });

  it('reports false instead of throwing when the database is down', async () => {
    mocks.prisma.emailOutbox.create.mockRejectedValue(new Error('db down'));
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await enqueueFailedEmail({}, new Error('x'), 'qstash')).toBe(false);
    error.mockRestore();
  });
});

describe('processEmailOutbox', () => {
  it('marks a resent email as sent', async () => {
    expect(await processEmailOutbox(NOW)).toEqual({ sent: 1, retrying: 0, failed: 0 });
    expect(mocks.runEmailJob).toHaveBeenCalledWith(row().payload);
    expect(lastUpdate().data).toMatchObject({ status: 'SENT', lockedUntil: null });
  });

  it('backs off and keeps retrying after a failure', async () => {
    mocks.runEmailJob.mockRejectedValue(new Error('still down'));
    expect(await processEmailOutbox(NOW)).toEqual({ sent: 0, retrying: 1, failed: 0 });
    expect(lastUpdate().data).toMatchObject({
      status: 'PENDING',
      lastError: 'still down',
      nextAttemptAt: new Date(NOW.getTime() + outboxBackoffHours(2) * HOUR),
    });
  });

  it('gives up after the last attempt and records it', async () => {
    mocks.prisma.emailOutbox.findMany.mockResolvedValue([row(OUTBOX_MAX_ATTEMPTS - 1)]);
    mocks.runEmailJob.mockRejectedValue(new Error('still down'));
    expect(await processEmailOutbox(NOW)).toEqual({ sent: 0, retrying: 0, failed: 1 });
    expect(lastUpdate().data.status).toBe('FAILED');
    expect(mocks.logAuditSystem).toHaveBeenCalledWith(
      'EMAIL_OUTBOX_GAVE_UP',
      expect.objectContaining({ outboxId: 'o1', attempts: OUTBOX_MAX_ATTEMPTS })
    );
  });

  it('gives up at once on a payload that can never send', async () => {
    mocks.runEmailJob.mockRejectedValue(new InvalidEmailJobError('Unknown jobType: x'));
    expect((await processEmailOutbox(NOW)).failed).toBe(1);
  });

  it('skips a row another run already claimed', async () => {
    mocks.prisma.emailOutbox.updateMany.mockResolvedValue({ count: 0 });
    expect(await processEmailOutbox(NOW)).toEqual({ sent: 0, retrying: 0, failed: 0 });
    expect(mocks.runEmailJob).not.toHaveBeenCalled();
  });

  it('purges old sent and failed rows', async () => {
    mocks.prisma.emailOutbox.findMany.mockResolvedValue([]);
    await processEmailOutbox(NOW);
    expect(mocks.prisma.emailOutbox.deleteMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { status: 'SENT', updatedAt: { lt: new Date(NOW.getTime() - 7 * 24 * HOUR) } },
          { status: 'FAILED', updatedAt: { lt: new Date(NOW.getTime() - 30 * 24 * HOUR) } },
        ],
      },
    });
  });
});

describe('outboxBackoffHours', () => {
  it('doubles each attempt and caps at a day', () => {
    expect([1, 2, 3, 4, 5, 6, 7].map(outboxBackoffHours)).toEqual([1, 2, 4, 8, 16, 24, 24]);
  });
});
