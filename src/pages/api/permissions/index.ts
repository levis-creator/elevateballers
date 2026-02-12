import type { APIRoute } from 'astro';
import { requireAnyPermission } from '../../../features/rbac/middleware';
import { prisma } from '../../../lib/prisma';

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
    console.error('Get permissions error:', error);

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

    return new Response(JSON.stringify({ error: 'Failed to fetch permissions' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
