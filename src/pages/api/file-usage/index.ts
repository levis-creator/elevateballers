import type { APIRoute } from 'astro';
import { requireAdmin } from '../../../features/cms/lib/auth';
import { getFileUsage, getFileUsageSummary } from '../../../lib/file-usage';

export const prerender = false;

/**
 * GET /api/file-usage
 * Get file usage information
 * Query params:
 *   - mediaId: Get usage for a specific media file
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    await requireAdmin(request);
    
    const url = new URL(request.url);
    const mediaId = url.searchParams.get('mediaId');
    
    if (!mediaId) {
      return new Response(
        JSON.stringify({ error: 'mediaId query parameter is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get detailed usage
    const usage = await getFileUsage(mediaId);
    
    // Get summary grouped by entity type
    const summary = await getFileUsageSummary(mediaId);

    return new Response(
      JSON.stringify({
        mediaId,
        usage,
        summary,
        totalUsages: usage.length,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error fetching file usage:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message === 'Unauthorized' || error.message.includes('Forbidden') 
          ? 'Unauthorized' 
          : 'Failed to fetch file usage' 
      }),
      {
        status: error.message === 'Unauthorized' || error.message.includes('Forbidden') ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
