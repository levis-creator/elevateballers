/**
 * GET /api/health
 * Returns 200 when the app and database are reachable, 503 otherwise.
 * No authentication required — intended for load balancers and uptime monitors.
 */
import type { APIRoute } from 'astro';
import { prisma } from '../../lib/prisma';

export const prerender = false;

/** A hung database must fail the check before an uptime monitor gives up waiting. */
const DB_CHECK_TIMEOUT_MS = 5_000;

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    // Never cached by Cloudflare or a browser: every check must reach the database.
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export const GET: APIRoute = async () => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`DB check timed out after ${DB_CHECK_TIMEOUT_MS}ms`)), DB_CHECK_TIMEOUT_MS);
      }),
    ]);
    return json({ status: 'ok', db: 'ok' }, 200);
  } catch (error) {
    console.error('[health] DB check failed:', error);
    return json({ status: 'error', db: 'unreachable' }, 503);
  } finally {
    clearTimeout(timer);
  }
};
