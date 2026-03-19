import type { APIRoute } from 'astro';
import { logAudit } from '../../../features/cms/lib/audit';

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
    console.error('Logout error:', error);
    return new Response(JSON.stringify({ error: 'Logout failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
