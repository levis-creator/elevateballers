import type { APIRoute } from 'astro';
import { requireAnyPermission } from '../../../features/rbac/middleware';
import { prisma } from '../../../lib/prisma';
import { handleApiError } from '../../../lib/apiError';

export const prerender = false;

/**
 * GET /api/permissions
 * List all available permissions, optionally grouped by category
 */
export const GET: APIRoute = async ({ request, url }) => {
  try {
    await requireAnyPermission(request, ['roles:read', 'roles:manage_permissions']);

    const groupBy = url.searchParams.get('groupBy');

    const permissions = await prisma.permission.findMany({
      orderBy: [
        { category: 'asc' },
        { resource: 'asc' },
        { action: 'asc' },
      ],
    });

    // If groupBy=category, group permissions by category
    if (groupBy === 'category') {
      const grouped: Record<string, any[]> = {};

      permissions.forEach(perm => {
        const category = perm.category || 'Other';
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push({
          id: perm.id,
          resource: perm.resource,
          action: perm.action,
          name: `${perm.resource}:${perm.action}`,
          description: perm.description,
          category: perm.category,
        });
      });

      return new Response(
        JSON.stringify({
          permissions: grouped,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Return flat list
    return new Response(
      JSON.stringify({
        permissions: permissions.map(perm => ({
          id: perm.id,
          resource: perm.resource,
          action: perm.action,
          name: `${perm.resource}:${perm.action}`,
          description: perm.description,
          category: perm.category,
        })),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return handleApiError(error, 'fetch permissions', request);
  }
};
