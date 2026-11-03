import { prisma } from './prisma';
import { sendSubscriberWelcome } from './email';
import { logAudit } from '@/features/cms/lib/audit';

export type ConfirmationStatus = 'ask' | 'confirmed' | 'already' | 'invalid';

/**
 * Second step of the double opt-in started by POST /api/subscribers.
 * Opening the emailed link (`submitted: false`) only asks for confirmation;
 * the page's form POST (`submitted: true`) activates the subscription, so mail
 * scanners that open links can't confirm on anyone's behalf.
 */
export async function confirmSubscription(
  request: Request,
  token: string,
  submitted: boolean,
): Promise<ConfirmationStatus> {
  if (!token) return 'invalid';
  const subscriber = await prisma.subscriber.findUnique({ where: { token } });
  if (!subscriber) return 'invalid';
  if (subscriber.active) return 'already';
  if (!submitted) return 'ask';

  await prisma.subscriber.update({ where: { token }, data: { active: true } });
  logAudit(request, 'SUBSCRIBER_CONFIRMED', { subscriberId: subscriber.id });
  sendSubscriberWelcome({ email: subscriber.email, name: subscriber.name || undefined, unsubscribeToken: subscriber.token }).catch((err) =>
    console.error('Failed to send welcome email:', err)
  );
  return 'confirmed';
}
