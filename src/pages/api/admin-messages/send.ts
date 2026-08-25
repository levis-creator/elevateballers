import type { APIRoute } from 'astro';
import { requirePermission } from '@/features/rbac/middleware';
import { handleApiError } from '@/lib/apiError';
import { sendAdminDirectEmail } from '@/lib/email';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    await requirePermission(request, 'contact_messages:read');
    const body = await request.json().catch(() => ({}));
    const name = String(body.name ?? '').trim().slice(0, 160);
    const email = String(body.email ?? '').trim().toLowerCase();
    const subject = String(body.subject ?? '').trim().slice(0, 200);
    const message = String(body.message ?? '').trim().slice(0, 5000);
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) return new Response(JSON.stringify({ error: 'A valid recipient email is required.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    if (!subject || !message) return new Response(JSON.stringify({ error: 'Subject and message are required.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    await sendAdminDirectEmail({ name, email, subject, message });
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return handleApiError(error, 'send admin message', request);
  }
};
