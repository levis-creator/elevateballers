import type { APIRoute } from 'astro';
import { requirePermission } from '../../../features/rbac/middleware';
import { sendRegistrationPaymentEmail } from '../../../lib/email';
import { publishToJob } from '../../../lib/qstash';
import { handleApiError } from '../../../lib/apiError';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    await requirePermission(request, 'teams:update');
    const data = await request.json();
    const required = ['name', 'email', 'teamName', 'amount'];
    const missing = required.filter((key) => !String(data[key] || '').trim());
    if (missing.length) {
      return new Response(JSON.stringify({ error: `Missing required fields: ${missing.join(', ')}` }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    const payload = {
      name: String(data.name).trim(), email: String(data.email).trim(), teamName: String(data.teamName).trim(), amount: String(data.amount).trim(),
      leagueName: data.leagueName ? String(data.leagueName) : null,
      seasonName: data.seasonName ? String(data.seasonName) : null,
      applicationId: data.applicationId ? String(data.applicationId) : null,
      status: 'paid',
    };
    const queued = await publishToJob('/api/jobs/send-email', { jobType: 'registration_payment_received', data: payload });
    if (!queued) await sendRegistrationPaymentEmail(payload);
    return new Response(JSON.stringify({ success: true, queued }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return handleApiError(error, 'send payment notification', request);
  }
};
