import { prisma } from '../../../lib/prisma';
import { sendTeamRegistrationAutoReply, sendPlayerRegistrationAutoReply, sendAdminNotificationEmail } from '../../../lib/email';

export async function processRegistrationEmailJob(jobId: string): Promise<void> {
  const db = prisma as any;
  const job = await db.publicRegistrationEmailJob.findUnique({ where: { id: jobId } });
  if (!job || job.status === 'SENT') return;
  const now = new Date();
  const claimed = await db.publicRegistrationEmailJob.updateMany({ where: { id: jobId, OR: [{ status: 'PENDING' }, { status: 'FAILED' }, { status: 'PROCESSING', lockedUntil: { lt: now } }], }, data: { status: 'PROCESSING', attempts: { increment: 1 }, lockedUntil: new Date(now.getTime() + 10 * 60 * 1000) } });
  if (!claimed.count) return;
  try {
    const payload = job.payload as { jobType: string; data: any };
    if (payload.jobType === 'team_registration_auto_reply') await sendTeamRegistrationAutoReply(payload.data);
    else if (payload.jobType === 'player_registration_auto_reply') await sendPlayerRegistrationAutoReply(payload.data);
    else if (payload.jobType === 'admin_notification') await sendAdminNotificationEmail(payload.data);
    else throw new Error(`Unsupported registration email job: ${payload.jobType}`);
    await db.publicRegistrationEmailJob.update({ where: { id: jobId }, data: { status: 'SENT', sentAt: new Date(), lockedUntil: null, lastError: null } });
  } catch (error) {
    await db.publicRegistrationEmailJob.update({ where: { id: jobId }, data: { status: 'FAILED', lockedUntil: null, lastError: error instanceof Error ? error.message : String(error) } });
    throw error;
  }
}
