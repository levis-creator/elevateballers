import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  update: vi.fn(),
  sendSubscriberWelcome: vi.fn(),
  logAudit: vi.fn(),
}));

vi.mock('../prisma', () => ({ prisma: { subscriber: { findUnique: mocks.findUnique, update: mocks.update } } }));
vi.mock('../email', () => ({ sendSubscriberWelcome: mocks.sendSubscriberWelcome }));
vi.mock('@/features/cms/lib/audit', () => ({ logAudit: mocks.logAudit }));

import { confirmSubscription } from '../subscriberConfirmation';

const request = new Request('https://elevateballers.com/subscribe/confirm');
const pending = { id: 'sub-1', email: 'fan@example.com', name: null, active: false, token: 'tok' };

describe('confirmSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sendSubscriberWelcome.mockResolvedValue(undefined);
  });

  it('only asks when the link is opened, so link scanners cannot confirm', async () => {
    mocks.findUnique.mockResolvedValue(pending);

    await expect(confirmSubscription(request, 'tok', false)).resolves.toBe('ask');
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.sendSubscriberWelcome).not.toHaveBeenCalled();
  });

  it('activates the subscriber and sends the welcome email when the form is submitted', async () => {
    mocks.findUnique.mockResolvedValue(pending);

    await expect(confirmSubscription(request, 'tok', true)).resolves.toBe('confirmed');
    expect(mocks.update).toHaveBeenCalledWith({ where: { token: 'tok' }, data: { active: true } });
    expect(mocks.sendSubscriberWelcome).toHaveBeenCalledWith({ email: 'fan@example.com', name: undefined, unsubscribeToken: 'tok' });
  });

  it('does nothing for an address that is already active', async () => {
    mocks.findUnique.mockResolvedValue({ ...pending, active: true });

    await expect(confirmSubscription(request, 'tok', true)).resolves.toBe('already');
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('rejects a missing or unknown token', async () => {
    await expect(confirmSubscription(request, '', true)).resolves.toBe('invalid');
    mocks.findUnique.mockResolvedValue(null);
    await expect(confirmSubscription(request, 'nope', true)).resolves.toBe('invalid');
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
