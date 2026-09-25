import { beforeEach, describe, expect, it, vi } from 'vitest';

const prisma = vi.hoisted(() => ({
  contactMessage: { findMany: vi.fn() },
  registrationNotification: { updateMany: vi.fn() },
}));
vi.mock('@/lib/prisma', () => ({ prisma }));

import { markContactNotificationsRead, withoutResolvedNotifications } from '../notificationCleanup';

beforeEach(() => vi.clearAllMocks());

describe('withoutResolvedNotifications', () => {
  it('drops and marks read notifications that were already handled', async () => {
    prisma.contactMessage.findMany.mockResolvedValue([{ id: 'open-msg' }]);
    const visible = await withoutResolvedNotifications([
      { id: 'n1', type: 'CONTACT_MESSAGE', metadata: { contactMessageId: 'open-msg' } },
      { id: 'n2', type: 'CONTACT_MESSAGE', metadata: { contactMessageId: 'replied-msg' } },
      { id: 'n3', type: 'PLAYER_REGISTERED', player: { approved: true } },
      { id: 'n4', type: 'PLAYER_REGISTERED', player: { approved: false } },
      { id: 'n5', type: 'TEAM_REGISTERED', team: { approved: true } },
    ]);
    expect(visible.map((n) => n.id)).toEqual(['n1', 'n4']);
    expect(prisma.contactMessage.findMany).toHaveBeenCalledWith({
      where: { id: { in: ['open-msg', 'replied-msg'] }, read: false, repliedAt: null, trashedAt: null },
      select: { id: true },
    });
    expect(prisma.registrationNotification.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['n2', 'n3', 'n5'] } },
      data: { read: true },
    });
  });

  it('writes nothing when everything is still open', async () => {
    const visible = await withoutResolvedNotifications([
      { id: 'n1', type: 'PLAYER_REGISTERED', player: { approved: false } },
    ]);
    expect(visible).toHaveLength(1);
    expect(prisma.contactMessage.findMany).not.toHaveBeenCalled();
    expect(prisma.registrationNotification.updateMany).not.toHaveBeenCalled();
  });
});

describe('markContactNotificationsRead', () => {
  it('matches notifications by the contact message id in their metadata', async () => {
    await markContactNotificationsRead(['m1']);
    expect(prisma.registrationNotification.updateMany).toHaveBeenCalledWith({
      where: {
        type: 'CONTACT_MESSAGE',
        read: false,
        OR: [{ metadata: { path: '$.contactMessageId', equals: 'm1' } }],
      },
      data: { read: true },
    });
  });
});
