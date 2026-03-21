import type { APIRoute } from 'astro';
import { requirePermission } from '../../../features/rbac/middleware';
import { getFileUsage, getFileUsageSummary } from '../../../lib/file-usage';
import { handleApiError } from '../../../lib/apiError';

export const prerender = false;

/**
 * GET /api/file-usage
 * Get file usage information
 * Query params:
 *   - mediaId: Get usage for a specific media file
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    await requirePermission(request, 'media:read');
    
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
  } catch (error) {
    return handleApiError(error, 'fetch file usage', request);
  }
};
