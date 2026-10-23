import type { APIRoute } from 'astro';
import { requirePermission } from '../../../features/rbac/middleware';
import { syncImapMailbox } from '../../../features/messages/application/imap-mailbox';
import { handleApiError, json } from '../../../lib/apiError';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    await requirePermission(request, 'contact_messages:read');
    return json(await syncImapMailbox(), 200);
  } catch (error) {
    return handleApiError(error, 'sync IMAP mailbox', request);
  }
};
