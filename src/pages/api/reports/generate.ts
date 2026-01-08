import type { APIRoute } from 'astro';
import { generateReport } from '../../../features/reports/lib/reportGenerator';
import { requireAuth } from '../../../features/cms/lib/auth';
import { getCurrentUser } from '../../../features/cms/lib/auth';

export const prerender = false;

/**
 * POST /api/reports/generate
 * Generate a report
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    await requireAuth(request);
    const user = await getCurrentUser(request);
    
    const body = await request.json();
    const { templateId, reportType, format, parameters } = body;

    if (!reportType || !format) {
      return new Response(
        JSON.stringify({ error: 'Report type and format are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const result = await generateReport(
      {
        templateId,
        reportType,
        format,
        parameters: parameters || {},
      },
      user?.id
    );

    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        reportGenerationId: result.reportGenerationId,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error generating report:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate report' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
