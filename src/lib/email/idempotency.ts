import { createHash } from 'node:crypto';
import { prisma } from '../prisma';
import { hashValue } from './providers';

/** Keys longer than the column are shortened to their prefix plus a hash. */
export function storedKey(idempotencyKey: string): string {
  if (idempotencyKey.length <= 150) return idempotencyKey;
  const prefix = idempotencyKey.split(':')[0].slice(0, 60);
  return `${prefix}:${createHash('sha256').update(idempotencyKey).digest('hex')}`;
}

const isUniqueViolation = (error: unknown) =>
  typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 'P2002';

/** Lower-cased, trimmed and de-duplicated, so one person is one recipient. */
export function normalizeRecipients(to: string | string[]): string[] {
  return [...new Set((Array.isArray(to) ? to : [to]).map((item) => item.trim().toLowerCase()).filter(Boolean))];
}

/**
 * Claims each recipient for this event and returns only those not already
 * mailed for it. The unique (key, recipient) row is the lock, so concurrent
 * retries of the same job cannot both send.
 *
 * If the table is unavailable (e.g. before its migration runs) the send goes
 * ahead unclaimed rather than silently dropping the email.
 */
export async function claimRecipients(key: string, recipients: string[]): Promise<string[]> {
  const idempotencyKey = storedKey(key);
  const claimed: string[] = [];
  for (const recipient of recipients) {
    try {
      await prisma.emailDelivery.create({ data: { idempotencyKey, recipientHash: hashValue(recipient) } });
      claimed.push(recipient);
    } catch (error) {
      if (isUniqueViolation(error)) continue;
      console.warn('[email] Could not record delivery claim; sending without duplicate protection:', error);
      return recipients;
    }
  }
  return claimed;
}

/** Releases claims after a failed send so a later retry can reach these recipients. */
export async function releaseRecipients(key: string, recipients: string[]): Promise<void> {
  const idempotencyKey = storedKey(key);
  if (!recipients.length) return;
  await prisma.emailDelivery
    .deleteMany({ where: { idempotencyKey, recipientHash: { in: recipients.map(hashValue) } } })
    .catch((error) => console.warn('[email] Could not release delivery claims:', error));
}
