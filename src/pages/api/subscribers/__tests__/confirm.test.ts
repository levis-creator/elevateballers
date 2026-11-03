import { beforeEach, describe, expect, it, vi } from 'vitest';

const confirmSubscription = vi.hoisted(() => vi.fn());
vi.mock('../../../../lib/subscriberConfirmation', () => ({ confirmSubscription }));

import { POST } from '../confirm';

const post = (body: unknown) =>
  POST({
    request: new Request('https://elevateballers.com/api/subscribers/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  } as any);

describe('POST /api/subscribers/confirm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('confirms with the token from the page', async () => {
    confirmSubscription.mockResolvedValue('confirmed');

    const response = await post({ token: 'tok' });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'confirmed' });
    expect(confirmSubscription).toHaveBeenCalledWith(expect.any(Request), 'tok', true);
  });

  it('returns 400 for an unknown token', async () => {
    confirmSubscription.mockResolvedValue('invalid');

    const response = await post({});

    expect(response.status).toBe(400);
    expect(confirmSubscription).toHaveBeenCalledWith(expect.any(Request), '', true);
  });
});
