import type { APIRoute } from 'astro';
import { requirePermission } from '../../../features/rbac/middleware';
import { prisma } from '../../../lib/prisma';
import { getUserIdFromRequest, writeAuditLog } from '../../../features/cms/lib/auth';

export const prerender = false;

/**
 * GET /api/roles
 * List all roles with permission counts
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    await requirePermission(request, 'roles:read');

    const roles = await prisma.role.findMany({
      include: {
        _count: {
          select: {
            permissions: true,
            userRoles: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return new Response(
      JSON.stringify({
        roles: roles.map(role => ({
          id: role.id,
          name: role.name,
          description: role.description,
          isSystem: role.isSystem,
          permissionCount: role._count.permissions,
          userCount: role._count.userRoles,
          createdAt: role.createdAt,
          updatedAt: role.updatedAt,
        })),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Get roles error:', error);

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

    return new Response(JSON.stringify({ error: 'Failed to fetch roles' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * POST /api/roles
 * Create a new role
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    await requirePermission(request, 'roles:create');

    const data = await request.json();
    const { name, description } = data;

    if (!name || typeof name !== 'string') {
      return new Response(JSON.stringify({ error: 'Name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if role already exists
    const existing = await prisma.role.findUnique({
      where: { name },
    });

    if (existing) {
      return new Response(JSON.stringify({ error: 'Role with this name already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const role = await prisma.role.create({
      data: {
        name,
        description: description || null,
        isSystem: false,
      },
    });

    const adminId = getUserIdFromRequest(request) ?? 'unknown';
    await writeAuditLog(adminId, 'ROLE_CREATED', adminId, {
      roleId: role.id,
      name: role.name,
    }).catch(() => {});

    return new Response(
      JSON.stringify({
        role: {
          id: role.id,
          name: role.name,
          description: role.description,
          isSystem: role.isSystem,
          createdAt: role.createdAt,
          updatedAt: role.updatedAt,
        },
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Create role error:', error);

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

    return new Response(JSON.stringify({ error: 'Failed to create role' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
