import type { APIRoute } from 'astro';
import { logAudit } from '../../../features/cms/lib/audit';
import { revokeSessionFromRequest } from '../../../features/cms/lib/auth';
import { handleApiError } from '../../../lib/apiError';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    await revokeSessionFromRequest(request);
    cookies.delete('auth-token', {
      path: '/',
    });

    await logAudit(request, 'AUTH_LOGOUT', { sessionRevoked: true });

    return new Response(JSON.stringify({ message: 'Logged out successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'logout', request);
  }
};
