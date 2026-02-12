import type { APIRoute } from 'astro';
import { requireAnyPermission } from '../../../features/rbac/middleware';
import { prisma } from '../../../lib/prisma';

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
    console.error('Get permission categories error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (error.message.includes('Forbidden')) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Failed to fetch categories' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
