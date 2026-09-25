import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  verifyQStashSignature: vi.fn(),
  runEmailJob: vi.fn(),
  enqueueFailedEmail: vi.fn(),
}));

vi.mock('../../../../lib/qstash-verify', () => ({ verifyQStashSignature: mocks.verifyQStashSignature }));
vi.mock('../../../../lib/qstash', () => ({ MAX_RETRIES_FIELD: '_qstashMaxRetries', QSTASH_DEFAULT_RETRIES: 3 }));
vi.mock('../../../../lib/email/outbox', () => ({ enqueueFailedEmail: mocks.enqueueFailedEmail }));
vi.mock('../../../../lib/email/jobs', () => {
  class InvalidEmailJobError extends Error {}
  return { InvalidEmailJobError, runEmailJob: mocks.runEmailJob };
});

import { POST } from '../send-email';
import { InvalidEmailJobError } from '../../../../lib/email/jobs';

const JOB = { jobType: 'admin_notification', data: { title: 'Hi' } };
const deliver = (body: unknown, retried: number) =>
  POST({
    request: new Request('https://site.test/api/jobs/send-email', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'Upstash-Retried': String(retried) },
      body: JSON.stringify(body),
    }),
  } as any);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.verifyQStashSignature.mockResolvedValue(true);
  mocks.enqueueFailedEmail.mockResolvedValue(true);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('POST /api/jobs/send-email', () => {
  it('runs the job without the retry marker', async () => {
    const response = await deliver({ ...JOB, _qstashMaxRetries: 5 }, 0);
    expect(response.status).toBe(200);
    expect(mocks.runEmailJob).toHaveBeenCalledWith(JOB);
  });

  it('returns 500 so QStash retries while attempts remain', async () => {
    mocks.runEmailJob.mockRejectedValue(new Error('smtp down'));
    expect((await deliver({ ...JOB, _qstashMaxRetries: 5 }, 4)).status).toBe(500);
    expect(mocks.enqueueFailedEmail).not.toHaveBeenCalled();
  });

  it('moves the job to the outbox on the last QStash delivery', async () => {
    const failure = new Error('smtp down');
    mocks.runEmailJob.mockRejectedValue(failure);
    const response = await deliver({ ...JOB, _qstashMaxRetries: 5 }, 5);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: false, deferred: true });
    expect(mocks.enqueueFailedEmail).toHaveBeenCalledWith(JOB, failure, 'qstash');
  });

  it('assumes QStash’s default retries for jobs published before the marker existed', async () => {
    mocks.runEmailJob.mockRejectedValue(new Error('smtp down'));
    expect((await deliver(JOB, 3)).status).toBe(200);
    expect(mocks.enqueueFailedEmail).toHaveBeenCalled();
  });

  it('still returns 500 if the outbox cannot store the job', async () => {
    mocks.runEmailJob.mockRejectedValue(new Error('smtp down'));
    mocks.enqueueFailedEmail.mockResolvedValue(false);
    expect((await deliver({ ...JOB, _qstashMaxRetries: 3 }, 3)).status).toBe(500);
  });

  it('leaves registration jobs to their own retry table', async () => {
    mocks.runEmailJob.mockRejectedValue(new Error('smtp down'));
    expect((await deliver({ registrationJobId: 'r1', _qstashMaxRetries: 3 }, 3)).status).toBe(500);
    expect(mocks.enqueueFailedEmail).not.toHaveBeenCalled();
  });

  it('rejects a payload that can never send', async () => {
    mocks.runEmailJob.mockRejectedValue(new InvalidEmailJobError('Unknown jobType: x'));
    expect((await deliver({ jobType: 'x' }, 3)).status).toBe(400);
    expect(mocks.enqueueFailedEmail).not.toHaveBeenCalled();
  });

  it('rejects an unsigned request', async () => {
    mocks.verifyQStashSignature.mockResolvedValue(false);
    expect((await deliver(JOB, 0)).status).toBe(401);
    expect(mocks.runEmailJob).not.toHaveBeenCalled();
  });
});
