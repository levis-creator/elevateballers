import type { APIRoute } from 'astro';
import { getReportGeneration } from '../../../../features/reports/lib/queries';

export const prerender = false;

/**
 * GET /api/reports/[id]/download
 * Download a generated report
 */
export const GET: APIRoute = async ({ params }) => {
  try {
    const id = params.id;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Report ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const reportGeneration = await getReportGeneration(id);
    if (!reportGeneration) {
      return new Response(JSON.stringify({ error: 'Report not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (reportGeneration.status !== 'COMPLETED') {
      return new Response(
        JSON.stringify({ error: 'Report generation is not completed' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // In a real implementation, you would fetch the file from storage (S3, local filesystem, etc.)
    // For now, this is a placeholder that returns the file URL or redirects
    // This would need to be implemented based on your storage solution

    if (reportGeneration.fileUrl) {
      // If file URL is provided, redirect to it
      return new Response(null, {
        status: 302,
        headers: {
          Location: reportGeneration.fileUrl,
        },
      });
    }

    // Placeholder: return a simple response
    return new Response('Report file not available', {
      status: 404,
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error: any) {
    console.error('Error downloading report:', error);
    return new Response(JSON.stringify({ error: 'Failed to download report' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
