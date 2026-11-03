import type { APIRoute } from 'astro';
import { confirmSubscription } from '../../../lib/subscriberConfirmation';
import { handleApiError } from '../../../lib/apiError';
export const prerender = false;

// Called by the button on /subscribe/confirm. It is a JSON request (not a form
// post) because Astro's origin check rejects form posts behind this host's proxy.
export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json().catch(() => ({}));
    const status = await confirmSubscription(request, String(data.token ?? ''), true);
    return new Response(JSON.stringify({ status }), {
      status: status === 'invalid' ? 400 : 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'confirm subscription', request);
  }
};
