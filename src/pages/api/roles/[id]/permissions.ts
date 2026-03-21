import type { APIRoute } from 'astro';
import { requirePermission } from '../../../../features/rbac/middleware';
import { invalidatePermissionCache } from '../../../../features/rbac/permissions';
import { prisma } from '../../../../lib/prisma';
import { getUserIdFromRequest, writeAuditLog } from '../../../../features/cms/lib/auth';
import { json, handleApiError } from '../../../../lib/apiError';

export const prerender = false;

/**
 * GET /api/roles/[id]/permissions
 * Get all permissions for a role
 */
export const GET: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'roles:read');

    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Role ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      return new Response(JSON.stringify({ error: 'Role not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        permissions: role.permissions.map(rp => ({
          id: rp.permission.id,
          resource: rp.permission.resource,
          action: rp.permission.action,
          description: rp.permission.description,
          category: rp.permission.category,
        })),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return handleApiError(error, 'fetch role permissions', request);
  }
};

/**
 * PUT /api/roles/[id]/permissions
 * Assign permissions to a role
 */
export const PUT: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'roles:manage_permissions');

    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Role ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await request.json();
    const { permissionIds } = data;

    if (!Array.isArray(permissionIds)) {
      return new Response(
        JSON.stringify({ error: 'permissionIds must be an array' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      return new Response(JSON.stringify({ error: 'Role not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify all permission IDs exist
    const permissions = await prisma.permission.findMany({
      where: {
        id: {
          in: permissionIds,
        },
      },
    });

    if (permissions.length !== permissionIds.length) {
      return new Response(
        JSON.stringify({ error: 'One or more permission IDs are invalid' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Remove all existing permissions for this role
    await prisma.rolePermission.deleteMany({
      where: { roleId: id },
    });

    // Add new permissions
    if (permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId: string) => ({
          roleId: id,
          permissionId,
        })),
      });
    }

    // Fetch updated role with permissions
    const updatedRole = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    // Invalidate the permission cache for every user that holds this role,
    // so the updated permissions take effect on their next request.
    const affectedUserRoles = await prisma.userRole.findMany({
      where: { roleId: id },
      select: { userId: true },
    });
    for (const { userId } of affectedUserRoles) {
      invalidatePermissionCache(userId);
    }

    const adminId = getUserIdFromRequest(request) ?? 'unknown';
    await writeAuditLog(adminId, 'ROLE_PERMISSIONS_UPDATED', adminId, {
      roleId: id,
      permissionIds,
    }).catch(() => {});

    return new Response(
      JSON.stringify({
        role: {
          id: updatedRole!.id,
          name: updatedRole!.name,
          permissions: updatedRole!.permissions.map(rp => ({
            id: rp.permission.id,
            resource: rp.permission.resource,
            action: rp.permission.action,
            description: rp.permission.description,
            category: rp.permission.category,
          })),
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return handleApiError(error, 'assign role permissions', request);
  }
};
