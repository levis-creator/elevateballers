import type { APIRoute } from 'astro';
import { logAudit } from '../../../features/audit/lib/audit';
import { handleApiError } from '../../../lib/apiError';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    cookies.delete('auth-token', {
      path: '/',
    });

    await logAudit(request, 'AUTH_LOGOUT', {});

    return new Response(JSON.stringify({ message: 'Logged out successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'logout', request);
  }
};
