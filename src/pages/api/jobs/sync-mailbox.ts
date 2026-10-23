import type { APIRoute } from 'astro';
import { syncImapMailbox } from '../../../features/messages/application/imap-mailbox';
import { handleApiError, json } from '../../../lib/apiError';
import { createOperationalNotification } from '../../../features/cms/lib/adminNotifications';

export const prerender = false;

/**
 * Server-side mailbox sync. Vercel invokes this from vercel.json; cPanel
 * installations can call it from a hosting cron using Authorization: Bearer.
 */
export const POST: APIRoute = async ({ request }) => {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get('authorization');
  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) return json({ error: 'Unauthorized' }, 401);

  try {
    return json(await syncImapMailbox(), 200);
  } catch (error) {
    await createOperationalNotification({
      type: 'MAILBOX_SYNC_FAILED',
      message: `Mailbox synchronization failed: ${error instanceof Error ? error.message : String(error)}`,
      severity: 'critical',
      metadata: { action: 'RETRY_MAILBOX_SYNC' },
    }).catch((notificationError) => console.warn('[mailbox] failure notification failed:', notificationError));
    return handleApiError(error, 'scheduled mailbox sync', request);
  }
};

export const GET = POST;
