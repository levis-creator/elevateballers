import type { APIRoute } from 'astro';
import { requirePermission } from '../../../features/rbac/middleware';
import { handleApiError } from '../../../lib/apiError';
import { emailWrapper, sendTransactionalEmail } from '../../../lib/email/core';

export const prerender = false;

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] || character);

export const POST: APIRoute = async ({ request }) => {
  try {
    await requirePermission(request, 'site_settings:manage');
    const input = await request.json() as { to?: string; subject?: string; body?: string; template?: string };
    const to = String(input.to || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return new Response(JSON.stringify({ error: 'Enter a valid test email address' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    const subject = String(input.subject || 'Elevate Ballers test email').slice(0, 200);
    const body = escapeHtml(String(input.body || 'This is a test notification.')).replace(/\r?\n/g, '<br />');
    await sendTransactionalEmail({
      to,
      subject: `[Test] ${subject}`,
      html: emailWrapper(`<p>${body}</p>`),
      dedupeKey: `settings-test-${Date.now()}`,
      audit: { type: 'EMAIL_SENT', template: `test_${String(input.template || 'notification')}` },
    });
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return handleApiError(error, 'send settings test email', request);
  }
};
