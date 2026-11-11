import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ queryRaw: vi.fn() }));
vi.mock('../../../lib/prisma', () => ({ prisma: { $queryRaw: mocks.queryRaw } }));

import { GET } from '../health';

const call = () => GET({} as any) as Promise<Response>;

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('GET /api/health', () => {
  it('returns 200 and is never cached when the database answers', async () => {
    mocks.queryRaw.mockResolvedValueOnce([{ 1: 1 }]);
    const response = await call();
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.json()).toEqual({ status: 'ok', db: 'ok' });
  });

  it('returns 503 when the database errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.queryRaw.mockRejectedValueOnce(new Error('Access denied'));
    const response = await call();
    expect(response.status).toBe(503);
  });

  it('returns 503 within 5 seconds when the database hangs', async () => {
    vi.useFakeTimers();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.queryRaw.mockReturnValueOnce(new Promise(() => undefined));
    const pending = call();
    await vi.advanceTimersByTimeAsync(5_000);
    expect((await pending).status).toBe(503);
  });
});
