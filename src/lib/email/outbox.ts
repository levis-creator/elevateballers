import { prisma } from '../prisma';
import { logAuditSystem } from '../../features/cms/lib/audit';

/** Attempts the hourly resend makes before giving up on an email. */
export const OUTBOX_MAX_ATTEMPTS = 6;
/** Hours to wait before the next resend: 1, 2, 4, 8, 16, capped at a day. */
export const outboxBackoffHours = (attempts: number) => Math.min(24, 2 ** Math.max(0, attempts - 1));

const message = (error: unknown) => (error instanceof Error ? error.message : String(error)).slice(0, 2000);

/**
 * Saves an email job whose send failed so the hourly maintenance run can
 * resend it. The first resend is due in an hour. Never throws: losing the
 * retry must not also fail the request that sent the email.
 */
export async function enqueueFailedEmail(
  payload: Record<string, unknown>,
  error: unknown,
  source: 'inline' | 'qstash'
): Promise<boolean> {
  try {
    const row = await prisma.emailOutbox.create({
      data: {
        payload: payload as any,
        source,
        lastError: message(error),
        nextAttemptAt: new Date(Date.now() + outboxBackoffHours(1) * 3_600_000),
      },
      select: { id: true },
    });
    logAuditSystem('EMAIL_QUEUED_FOR_RETRY', {
      outboxId: row.id,
      source,
      jobType: typeof payload.jobType === 'string' ? payload.jobType : 'direct',
      error: message(error),
    });
    return true;
  } catch (cause) {
    console.error('[email-outbox] could not save failed email for retry:', cause);
    return false;
  }
}

export { message as outboxErrorMessage };
