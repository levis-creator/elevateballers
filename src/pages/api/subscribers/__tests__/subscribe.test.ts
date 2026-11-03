import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  verifyTurnstile: vi.fn(),
  enforceRateLimit: vi.fn(),
  checkEmailDomain: vi.fn(),
  sendSubscriberConfirmation: vi.fn(),
  logAudit: vi.fn(),
}));

vi.mock('../../../../lib/prisma', () => ({
  prisma: { subscriber: { findUnique: mocks.findUnique, create: mocks.create, update: mocks.update } },
}));
vi.mock('../../../../lib/turnstile', () => ({ verifyTurnstile: mocks.verifyTurnstile }));
vi.mock('../../../../lib/rateLimit', () => ({ enforceRateLimit: mocks.enforceRateLimit }));
vi.mock('../../../../lib/emailDomain', () => ({ checkEmailDomain: mocks.checkEmailDomain }));
vi.mock('../../../../lib/email', () => ({ sendSubscriberConfirmation: mocks.sendSubscriberConfirmation }));
vi.mock('../../../../features/rbac/middleware', () => ({ requirePermission: vi.fn() }));
vi.mock('@/features/cms/lib/audit', () => ({ logAudit: mocks.logAudit }));

import { POST } from '../index';

const subscribe = (body: Record<string, unknown>) =>
  POST({
    request: new Request('https://elevateballers.com/api/subscribers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 'cf-turnstile-token': 'token', ...body }),
    }),
    clientAddress: '203.0.113.7',
  } as any);

describe('POST /api/subscribers (double opt-in)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.verifyTurnstile.mockResolvedValue(true);
    mocks.enforceRateLimit.mockResolvedValue(null);
    mocks.checkEmailDomain.mockResolvedValue('ok');
    mocks.sendSubscriberConfirmation.mockResolvedValue(undefined);
    mocks.findUnique.mockResolvedValue(null);
    mocks.create.mockImplementation(async ({ data }) => ({ id: 'sub-1', token: 'confirm-token', name: null, ...data }));
    mocks.update.mockImplementation(async ({ data }) => ({ id: 'sub-2', token: 'old-token', name: null, ...data }));
  });

  it('stores a new sign-up as inactive and emails a confirmation link', async () => {
    const response = await subscribe({ email: ' Fan@Example.com ' });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ ok: true, confirmationSent: true });
    expect(mocks.create).toHaveBeenCalledWith({ data: { email: 'fan@example.com', name: undefined, active: false } });
    expect(mocks.sendSubscriberConfirmation).toHaveBeenCalledWith({ email: 'fan@example.com', name: undefined, token: 'confirm-token' });
  });

  it('asks a returning, inactive address to confirm again instead of reactivating it', async () => {
    mocks.findUnique.mockResolvedValue({ id: 'sub-2', email: 'fan@example.com', active: false, name: null, token: 'old-token' });

    const response = await subscribe({ email: 'fan@example.com' });

    expect(response.status).toBe(201);
    expect(mocks.update).toHaveBeenCalledWith({ where: { email: 'fan@example.com' }, data: { name: null } });
    expect(mocks.sendSubscriberConfirmation).toHaveBeenCalledWith(expect.objectContaining({ token: 'old-token' }));
  });

  it('does not email an address that is already subscribed', async () => {
    mocks.findUnique.mockResolvedValue({ id: 'sub-3', email: 'fan@example.com', active: true });

    const response = await subscribe({ email: 'fan@example.com' });

    expect(await response.json()).toEqual({ ok: true, alreadySubscribed: true });
    expect(mocks.sendSubscriberConfirmation).not.toHaveBeenCalled();
  });

  it.each([
    ['disposable', 'temporary'],
    ['no-mail', 'typos'],
  ])('rejects a %s domain before saving anything', async (result, wording) => {
    mocks.checkEmailDomain.mockResolvedValue(result);

    const response = await subscribe({ email: 'fan@example.com' });

    expect(response.status).toBe(400);
    expect((await response.json()).error).toContain(wording);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('stops repeated confirmation emails to the same address', async () => {
    const limited = new Response(JSON.stringify({ error: 'limited' }), { status: 429 });
    mocks.enforceRateLimit.mockImplementation(async (key: string) => (key.startsWith('subscribe:email:') ? limited : null));

    const response = await subscribe({ email: 'fan@example.com' });

    expect(response.status).toBe(429);
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.sendSubscriberConfirmation).not.toHaveBeenCalled();
  });
});
