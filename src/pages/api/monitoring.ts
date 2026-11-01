import type { APIRoute } from 'astro';

export const prerender = false;

/**
 * POST /api/monitoring
 *
 * Sentry tunnel: the browser SDK posts error envelopes here instead of to
 * *.ingest.sentry.io, which ad and privacy blockers commonly block. Only
 * envelopes addressed to this site's own Sentry project are forwarded, so the
 * route can't be used to relay traffic anywhere else.
 */

// A browser error envelope is a few KB; anything far larger is not ours.
const MAX_ENVELOPE_BYTES = 256 * 1024;

const empty = (status: number) => new Response(null, { status });

function allowedTarget(): { host: string; projectId: string } | null {
  const dsn = process.env.SENTRY_DSN || import.meta.env.PUBLIC_SENTRY_DSN;
  if (!dsn) return null;
  try {
    const url = new URL(dsn);
    const projectId = url.pathname.replace(/^\//, '');
    return projectId ? { host: url.hostname, projectId } : null;
  } catch {
    return null;
  }
}

export const POST: APIRoute = async ({ request }) => {
  const target = allowedTarget();
  if (!target) return empty(404);

  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (declaredLength > MAX_ENVELOPE_BYTES) return empty(413);

  const envelope = await request.text();
  if (envelope.length > MAX_ENVELOPE_BYTES) return empty(413);

  // The first line of an envelope is a JSON header naming the DSN it is for.
  let dsn: URL;
  try {
    const header = JSON.parse(envelope.slice(0, envelope.indexOf('\n')));
    dsn = new URL(header.dsn);
  } catch {
    return empty(400);
  }
  const projectId = dsn.pathname.replace(/^\//, '');
  if (dsn.hostname !== target.host || projectId !== target.projectId) return empty(403);

  try {
    const upstream = await fetch(`https://${target.host}/api/${projectId}/envelope/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-sentry-envelope' },
      body: envelope,
    });
    return empty(upstream.status);
  } catch (error) {
    console.warn('[monitoring] Sentry tunnel forward failed:', error);
    return empty(502);
  }
};
