import { beforeEach, describe, expect, it, vi } from 'vitest';

const publishJSON = vi.hoisted(() => vi.fn());

vi.mock('@upstash/qstash', () => ({
  Client: class {
    publishJSON = publishJSON;
  },
}));
vi.mock('../env', () => ({
  getEnv: (key: string) => ({ QSTASH_TOKEN: 'token', SITE_URL: 'https://site.test/' })[key],
}));

import { publishToJob, QSTASH_RETRIES, QSTASH_DEFAULT_RETRIES } from '../qstash';

beforeEach(() => {
  publishJSON.mockReset();
});

describe('publishToJob', () => {
  it('asks QStash for the explicit retry count and stamps it into the body', async () => {
    publishJSON.mockResolvedValue({});
    expect(await publishToJob('/api/jobs/send-email', { jobType: 'x' })).toBe(true);
    expect(publishJSON).toHaveBeenCalledWith({
      url: 'https://site.test/api/jobs/send-email',
      body: { jobType: 'x', _qstashMaxRetries: QSTASH_RETRIES },
      retries: QSTASH_RETRIES,
    });
  });

  it('falls back to QStash’s default when the explicit count is rejected', async () => {
    publishJSON.mockRejectedValueOnce(new Error('retries exceeds plan limit')).mockResolvedValueOnce({});
    expect(await publishToJob('/api/jobs/send-email', { jobType: 'x' })).toBe(true);
    expect(publishJSON).toHaveBeenLastCalledWith({
      url: 'https://site.test/api/jobs/send-email',
      body: { jobType: 'x', _qstashMaxRetries: QSTASH_DEFAULT_RETRIES },
    });
  });

  it('returns false so the caller sends inline when QStash is unreachable', async () => {
    publishJSON.mockRejectedValue(new Error('network'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await publishToJob('/api/jobs/send-email', {})).toBe(false);
    warn.mockRestore();
  });
});
