/**
 * POST /api/jobs/recalc-standings
 *
 * Background job endpoint called by QStash to recalculate and warm
 * the standings cache after a game ends. Protected by QStash signature.
 */

import type { APIRoute } from 'astro';
import { verifyQStashSignature } from '../../../lib/qstash-verify';
import { getStandings } from '../../../features/standings/lib/getStandings';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const isValid = await verifyQStashSignature(request);
  if (!isValid) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { leagueId, seasonId } = body;

    // Recompute standings — the cache is populated as a side-effect
    await getStandings({ leagueId, seasonId });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[jobs/recalc-standings] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
