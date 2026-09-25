import { publishToJob } from '@/lib/qstash';
import { enqueueFailedEmail } from '@/lib/email/outbox';

/**
 * Queue an email job on QStash when configured; otherwise send inline (a
 * background send can be cut off once a serverless response returns) and hand
 * a failure to the email outbox for the hourly resend. Email failures never
 * fail the request that triggered them. `jobType` and `data` must match a case
 * in runEmailJob so the queued and retried paths can replay it.
 */
export async function queueOrSend(jobType: string, data: Record<string, unknown>, sendNow: () => Promise<void>) {
  try {
    if (await publishToJob('/api/jobs/send-email', { jobType, data })) return;
  } catch (error) {
    console.error(`[email] ${jobType} could not be queued:`, error);
  }
  try {
    await sendNow();
  } catch (error) {
    console.error(`[email] ${jobType} failed, saved for retry:`, error);
    await enqueueFailedEmail({ jobType, data }, error, 'inline');
  }
}

export const escapeEmailHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] || char);
