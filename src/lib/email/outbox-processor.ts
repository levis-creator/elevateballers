import { prisma } from '../prisma';
import { logAuditSystem } from '../../features/cms/lib/audit';
import { InvalidEmailJobError, runEmailJob } from './jobs';
import { OUTBOX_MAX_ATTEMPTS, outboxBackoffHours, outboxErrorMessage } from './outbox';

const BATCH = 20;
const LOCK_MINUTES = 10;
const KEEP_SENT_DAYS = 7;
const KEEP_FAILED_DAYS = 30;

/**
 * Resends due outbox emails. Each row is claimed with a short lock first so two
 * overlapping runs never send the same email twice.
 */
export async function processEmailOutbox(now = new Date()) {
  const due = await prisma.emailOutbox.findMany({
    where: {
      status: 'PENDING',
      nextAttemptAt: { lte: now },
      OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }],
    },
    orderBy: { nextAttemptAt: 'asc' },
    take: BATCH,
    select: { id: true, payload: true, attempts: true },
  });

  let sent = 0;
  let retrying = 0;
  let failed = 0;
  for (const row of due) {
    const claimed = await prisma.emailOutbox.updateMany({
      where: { id: row.id, status: 'PENDING', OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }] },
      data: { lockedUntil: new Date(now.getTime() + LOCK_MINUTES * 60_000), attempts: { increment: 1 } },
    });
    if (!claimed.count) continue;
    const attempts = row.attempts + 1;
    try {
      await runEmailJob(row.payload);
      await prisma.emailOutbox.update({
        where: { id: row.id },
        data: { status: 'SENT', sentAt: new Date(), lockedUntil: null, lastError: null },
      });
      sent += 1;
    } catch (error) {
      const giveUp = error instanceof InvalidEmailJobError || attempts >= OUTBOX_MAX_ATTEMPTS;
      await prisma.emailOutbox.update({
        where: { id: row.id },
        data: {
          status: giveUp ? 'FAILED' : 'PENDING',
          lockedUntil: null,
          lastError: outboxErrorMessage(error),
          nextAttemptAt: new Date(now.getTime() + outboxBackoffHours(attempts + 1) * 3_600_000),
        },
      });
      if (giveUp) {
        failed += 1;
        logAuditSystem('EMAIL_OUTBOX_GAVE_UP', { outboxId: row.id, attempts, error: outboxErrorMessage(error) });
      } else retrying += 1;
    }
  }

  // Payloads hold recipient details, so don't keep them longer than needed.
  const day = 86_400_000;
  await prisma.emailOutbox.deleteMany({
    where: {
      OR: [
        { status: 'SENT', updatedAt: { lt: new Date(now.getTime() - KEEP_SENT_DAYS * day) } },
        { status: 'FAILED', updatedAt: { lt: new Date(now.getTime() - KEEP_FAILED_DAYS * day) } },
      ],
    },
  });

  return { sent, retrying, failed };
}
