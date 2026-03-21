/**
 * GET /api/health
 * Returns 200 when the app and database are reachable, 503 otherwise.
 * No authentication required — intended for load balancers and uptime monitors.
 */
import type { APIRoute } from 'astro';
import { prisma } from '../../lib/prisma';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return new Response(JSON.stringify({ status: 'ok', db: 'ok' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[health] DB check failed:', error);
    return new Response(JSON.stringify({ status: 'error', db: 'unreachable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
