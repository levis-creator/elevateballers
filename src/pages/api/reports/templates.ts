import type { APIRoute } from 'astro';
import { getAllReportTemplates, getReportTemplatesByType } from '../../../features/reports/lib/queries';
import { requirePermission } from '../../../features/rbac/middleware';

import { handleApiError } from '../../../lib/apiError';
export const prerender = false;

/**
 * GET /api/reports/templates
 * Get report templates
 * Query parameters:
 * - type: Filter by report type
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    await requirePermission(request, 'reports:read');
    const url = new URL(request.url);
    const typeParam = url.searchParams.get('type');

    let templates;
    if (typeParam) {
      templates = await getReportTemplatesByType(typeParam as any);
    } else {
      templates = await getAllReportTemplates();
    }

    return new Response(JSON.stringify(templates), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error fetching report templates:', error);
    return handleApiError(error, "fetch report templates");
  }
};
