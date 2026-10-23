import type { APIRoute } from 'astro';
import { requirePermission } from '../../../features/rbac/middleware';
import { testImapConnection } from '../../../features/messages/application/imap-mailbox';
import { handleApiError, json } from '../../../lib/apiError';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    await requirePermission(request, 'contact_messages:read');
    return json(await testImapConnection(), 200);
  } catch (error) {
    return handleApiError(error, 'test IMAP connection', request);
  }
};
