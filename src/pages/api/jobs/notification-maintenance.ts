import type { APIRoute } from 'astro';
import { sendDueMatchReminders } from '../../../features/settings/application/notificationMaintenance';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) return new Response(JSON.stringify({ error: 'CRON_SECRET is not configured' }), { status: 503 });
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  try {
    const result = await sendDueMatchReminders();
    return new Response(JSON.stringify({ success: true, ...result }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[notification-maintenance] failed:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), { status: 500 });
  }
};
