import type { APIRoute } from 'astro';
import { syncMatchToMaxPreps } from '../../../../features/reports/lib/maxpreps';
import { requireAuth } from '../../../../features/cms/lib/auth';

export const prerender = false;

/**
 * POST /api/integrations/maxpreps/sync
 * Sync match data to MaxPreps
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    await requireAuth(request);
    
    const body = await request.json();
    const { matchId } = body;

    if (!matchId) {
      return new Response(
        JSON.stringify({ error: 'Match ID is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const result = await syncMatchToMaxPreps(matchId);

    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Match synced to MaxPreps successfully',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error syncing to MaxPreps:', error);
    return new Response(JSON.stringify({ error: 'Failed to sync to MaxPreps' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
