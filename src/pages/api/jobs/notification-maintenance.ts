import type { APIRoute } from 'astro';
import { sendDueMatchReminders } from '../../../features/settings/application/notificationMaintenance';
import { processEmailOutbox } from '../../../lib/email/outbox-processor';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) return new Response(JSON.stringify({ error: 'CRON_SECRET is not configured' }), { status: 503 });
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  try {
    const result = await sendDueMatchReminders();
    // Failed emails ride on the same hourly ping; a problem here must not hide the reminder result.
    const outbox = await processEmailOutbox().catch((error) => {
      console.error('[notification-maintenance] email outbox failed:', error);
      return { error: error instanceof Error ? error.message : String(error) };
    });
    return new Response(JSON.stringify({ success: true, ...result, outbox }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[notification-maintenance] failed:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), { status: 500 });
  }
};
