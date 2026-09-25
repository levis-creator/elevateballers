import { prisma } from '@/lib/prisma';

/** Clear the admin notification for contact messages that were read, replied to, trashed or deleted. */
export async function markContactNotificationsRead(contactMessageIds: string[]) {
  if (!contactMessageIds.length) return;
  await prisma.registrationNotification.updateMany({
    where: {
      type: 'CONTACT_MESSAGE',
      read: false,
      OR: contactMessageIds.map((id) => ({ metadata: { path: '$.contactMessageId', equals: id } })),
    },
    data: { read: true },
  });
}

type NotificationLike = {
  id: string;
  type: string;
  metadata?: unknown;
  player?: { approved?: boolean | null } | null;
  team?: { approved?: boolean | null } | null;
};

const contactIdOf = (n: NotificationLike) => {
  const meta = n.metadata as { contactMessageId?: unknown } | null | undefined;
  return typeof meta?.contactMessageId === 'string' ? meta.contactMessageId : null;
};

/**
 * Drops unread notifications whose subject was already handled elsewhere (a
 * message answered in the inbox, a player or team approved on its own page)
 * and marks them read so they stop resurfacing.
 */
export async function withoutResolvedNotifications<T extends NotificationLike>(notifications: T[]): Promise<T[]> {
  const contactIds = [...new Set(notifications.map(contactIdOf).filter((id): id is string => Boolean(id)))];
  const openContactIds = new Set(
    contactIds.length
      ? (
          await prisma.contactMessage.findMany({
            where: { id: { in: contactIds }, read: false, repliedAt: null, trashedAt: null },
            select: { id: true },
          })
        ).map((m) => m.id)
      : []
  );
  const isResolved = (n: T) => {
    if (n.type === 'CONTACT_MESSAGE') {
      const id = contactIdOf(n);
      return !id || !openContactIds.has(id);
    }
    if (n.type === 'PLAYER_REGISTERED') return n.player?.approved === true;
    if (n.type === 'TEAM_REGISTERED') return n.team?.approved === true;
    return false;
  };
  const resolved = notifications.filter(isResolved).map((n) => n.id);
  if (resolved.length)
    await prisma.registrationNotification.updateMany({ where: { id: { in: resolved } }, data: { read: true } });
  return notifications.filter((n) => !isResolved(n));
}
