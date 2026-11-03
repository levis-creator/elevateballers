import { prisma } from '../../../lib/prisma';
import { sendTeamRegistrationAutoReply, sendPlayerRegistrationAutoReply, sendAdminNotificationEmail } from '../../../lib/email';
import { resolveEmailDeliverySettings, siteSettingsService } from '../../settings';

/** Returns true when this call sent the email; false when there was nothing to send. */
export async function processRegistrationEmailJob(jobId: string): Promise<boolean> {
  const db = prisma as any;
  const job = await db.publicRegistrationEmailJob.findUnique({ where: { id: jobId } });
  if (!job || job.status === 'SENT' || job.status === 'EXHAUSTED') return false;
  const delivery = resolveEmailDeliverySettings(await siteSettingsService.list('emailDelivery').catch(() => []));
  if (job.attempts >= delivery.retries + 1) {
    await db.publicRegistrationEmailJob.update({ where: { id: jobId }, data: { status: 'EXHAUSTED', lockedUntil: null } });
    return false;
  }
  const now = new Date();
  const claimed = await db.publicRegistrationEmailJob.updateMany({ where: { id: jobId, OR: [{ status: 'PENDING' }, { status: 'FAILED' }, { status: 'PROCESSING', lockedUntil: { lt: now } }], }, data: { status: 'PROCESSING', attempts: { increment: 1 }, lockedUntil: new Date(now.getTime() + 10 * 60 * 1000) } });
  if (!claimed.count) return false;
  try {
    const payload = job.payload as { jobType: string; data: any };
    if (payload.jobType === 'team_registration_auto_reply') await sendTeamRegistrationAutoReply(payload.data);
    else if (payload.jobType === 'player_registration_auto_reply') await sendPlayerRegistrationAutoReply(payload.data);
    else if (payload.jobType === 'admin_notification') await sendAdminNotificationEmail(payload.data);
    else throw new Error(`Unsupported registration email job: ${payload.jobType}`);
    await db.publicRegistrationEmailJob.update({ where: { id: jobId }, data: { status: 'SENT', sentAt: new Date(), lockedUntil: null, lastError: null } });
    return true;
  } catch (error) {
    await db.publicRegistrationEmailJob.update({ where: { id: jobId }, data: { status: 'FAILED', lockedUntil: null, lastError: error instanceof Error ? error.message : String(error) } });
    throw error;
  }
}

const RETRY_BATCH = 20;
// The endpoint sends a job right after responding; only pick up PENDING jobs
// that the process never got to (for example after a restart).
const STALE_PENDING_MINUTES = 10;

/**
 * Re-runs registration email jobs that failed or were never sent. Each job is
 * claimed by processRegistrationEmailJob, so an overlapping run cannot send twice,
 * and jobs past the retry limit are marked EXHAUSTED there.
 */
export async function retryRegistrationEmailJobs(now = new Date()): Promise<{ sent: number; failed: number }> {
  const db = prisma as any;
  const due = await db.publicRegistrationEmailJob.findMany({
    where: {
      OR: [
        { status: 'FAILED' },
        { status: 'PENDING', createdAt: { lt: new Date(now.getTime() - STALE_PENDING_MINUTES * 60_000) } },
        { status: 'PROCESSING', lockedUntil: { lt: now } },
      ],
    },
    orderBy: { updatedAt: 'asc' },
    take: RETRY_BATCH,
    select: { id: true },
  });

  let sent = 0;
  let failed = 0;
  for (const { id } of due) {
    try {
      if (await processRegistrationEmailJob(id)) sent += 1;
    } catch (error) {
      failed += 1;
      console.warn('[registration] email job retry failed:', id, error instanceof Error ? error.message : error);
    }
  }
  return { sent, failed };
}
