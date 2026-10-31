import { enqueueFailedEmail } from '@/lib/email/outbox';

/**
 * Send an email inline and hand a failure to the email outbox for the hourly
 * resend. Email failures never fail the request that triggered them.
 * `jobType` and `data` must match a case in runEmailJob so the outbox can
 * replay it.
 */
export async function queueOrSend(jobType: string, data: Record<string, unknown>, sendNow: () => Promise<void>) {
  try {
    await sendNow();
  } catch (error) {
    console.error(`[email] ${jobType} failed, saved for retry:`, error);
    await enqueueFailedEmail({ jobType, data }, error, 'inline');
  }
}

export const escapeEmailHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] || char);
