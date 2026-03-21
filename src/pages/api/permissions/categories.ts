import type { APIRoute } from 'astro';
import { requireAnyPermission } from '../../../features/rbac/middleware';
import { prisma } from '../../../lib/prisma';
import { handleApiError } from '../../../lib/apiError';

export const prerender = false;

/**
 * GET /api/permissions/categories
 * Get list of permission categories with counts
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    await requireAnyPermission(request, ['roles:read', 'roles:manage_permissions']);

    const permissions = await prisma.permission.findMany({
      select: {
        category: true,
      },
    });

    // Count permissions per category
    const categoryCounts: Record<string, number> = {};
    permissions.forEach(perm => {
      const category = perm.category || 'Other';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    // Convert to array and sort
    const categories = Object.entries(categoryCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return new Response(
      JSON.stringify({
        categories,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return handleApiError(error, 'fetch permission categories', request);
  }
};
