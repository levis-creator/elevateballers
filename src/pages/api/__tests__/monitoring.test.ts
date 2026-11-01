import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../monitoring';

const DSN = 'https://publickey@o1.ingest.de.sentry.io/42';

const envelope = (dsn: string) =>
  `${JSON.stringify({ event_id: 'abc', dsn })}\n{"type":"event"}\n{"message":"boom"}`;

const call = (body: string) =>
  POST({ request: new Request('https://site.test/api/monitoring', { method: 'POST', body }) } as any);

describe('POST /api/monitoring', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    process.env.SENTRY_DSN = DSN;
    fetchMock.mockReset().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    delete process.env.SENTRY_DSN;
    vi.unstubAllGlobals();
  });

  it('forwards envelopes for this project to Sentry', async () => {
    const response = await call(envelope(DSN));
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://o1.ingest.de.sentry.io/api/42/envelope/',
      expect.objectContaining({ method: 'POST', body: envelope(DSN) })
    );
  });

  it('refuses envelopes addressed to another Sentry project or host', async () => {
    expect((await call(envelope('https://k@o1.ingest.de.sentry.io/99'))).status).toBe(403);
    expect((await call(envelope('https://k@evil.example/42'))).status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects bodies without a valid envelope header', async () => {
    expect((await call('not json\n{}')).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects oversized envelopes', async () => {
    expect((await call(envelope(DSN) + 'x'.repeat(300 * 1024))).status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('is disabled when no DSN is configured', async () => {
    delete process.env.SENTRY_DSN;
    vi.stubEnv('PUBLIC_SENTRY_DSN', '');
    expect((await call(envelope(DSN))).status).toBe(404);
    vi.unstubAllEnvs();
  });

  it('reports a failed forward as 502', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect((await call(envelope(DSN))).status).toBe(502);
    warn.mockRestore();
  });
});
