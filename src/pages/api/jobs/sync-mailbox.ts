import type { APIRoute } from 'astro';
import { syncImapMailbox } from '../../../features/messages/application/imap-mailbox';
import { handleApiError, json } from '../../../lib/apiError';

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
    return handleApiError(error, 'scheduled mailbox sync', request);
  }
};

export const GET = POST;
