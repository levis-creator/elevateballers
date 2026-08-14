import type { APIRoute } from 'astro';
import { recordEmailDeliveryEvent, verifyEmailTrackingToken } from '../../../../lib/email/core';

export const prerender = false;

const PIXEL = Uint8Array.from(Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'));

export const GET: APIRoute = async ({ params, url }) => {
  const eventId = String(params.eventId || '');
  const token = url.searchParams.get('t') || '';
  if (eventId && verifyEmailTrackingToken(eventId, token)) {
    void recordEmailDeliveryEvent({ provider: 'tracking-pixel', event: 'opened', providerMessageId: eventId });
  }
  return new Response(PIXEL, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, max-age=0',
      'Content-Length': String(PIXEL.byteLength),
    },
  });
};
