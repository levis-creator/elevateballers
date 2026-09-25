import { beforeEach, describe, expect, it, vi } from 'vitest';

const prisma = vi.hoisted(() => ({ emailDelivery: { create: vi.fn(), deleteMany: vi.fn() } }));
vi.mock('../../prisma', () => ({ prisma }));
vi.mock('../providers', () => ({ hashValue: (value: string) => `h(${value})` }));

import { claimRecipients, normalizeRecipients, releaseRecipients, storedKey } from '../idempotency';

const unique = Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });

beforeEach(() => {
  vi.clearAllMocks();
  prisma.emailDelivery.create.mockResolvedValue({});
  prisma.emailDelivery.deleteMany.mockResolvedValue({ count: 0 });
});

describe('normalizeRecipients', () => {
  it('lower-cases, trims and removes duplicate addresses', () => {
    expect(normalizeRecipients([' Admin@Site.com', 'admin@site.com', 'coach@site.com', ''])).toEqual([
      'admin@site.com',
      'coach@site.com',
    ]);
  });
});

describe('claimRecipients', () => {
  it('returns only recipients not already mailed for this event', async () => {
    prisma.emailDelivery.create.mockImplementation(async ({ data }: any) => {
      if (data.recipientHash === 'h(a@x.com)') throw unique;
      return {};
    });
    expect(await claimRecipients('lineup:m1', ['a@x.com', 'b@x.com'])).toEqual(['b@x.com']);
    expect(prisma.emailDelivery.create).toHaveBeenCalledWith({
      data: { idempotencyKey: 'lineup:m1', recipientHash: 'h(b@x.com)' },
    });
  });

  it('sends to everyone when the table is unavailable rather than dropping the email', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    prisma.emailDelivery.create.mockRejectedValue(new Error("Table 'email_deliveries' doesn't exist"));
    expect(await claimRecipients('k', ['a@x.com', 'b@x.com'])).toEqual(['a@x.com', 'b@x.com']);
    warn.mockRestore();
  });
});

describe('releaseRecipients', () => {
  it('removes the claims so a retry can send again', async () => {
    await releaseRecipients('k', ['a@x.com']);
    expect(prisma.emailDelivery.deleteMany).toHaveBeenCalledWith({
      where: { idempotencyKey: 'k', recipientHash: { in: ['h(a@x.com)'] } },
    });
  });
});

describe('storedKey', () => {
  it('keeps short keys and shortens long ones to fit the column', () => {
    expect(storedKey('roster-request:h1')).toBe('roster-request:h1');
    const long = storedKey(`roster-decision:${'r'.repeat(400)}`);
    expect(long).toMatch(/^roster-decision:[0-9a-f]{64}$/);
    expect(long.length).toBeLessThanOrEqual(191);
  });
});
