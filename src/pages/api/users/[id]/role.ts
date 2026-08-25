import type { APIRoute } from 'astro';
import { requireSystemAdmin } from '@/features/rbac/auth-helpers';
import { requirePermission } from '../../../../features/rbac/middleware';
import { invalidatePermissionCache } from '../../../../features/rbac/permissions';
import { prisma } from '../../../../lib/prisma';
import { json, handleApiError } from '../../../../lib/apiError';
import { ADMIN_ROLE_NAME, COACH_ROLE_NAME } from '../../../../features/users/domain/entities/user-directory';

export const prerender = false;

/**
 * PUT /api/users/[id]/role
 * Assign roles to a user (replaces existing roles)
 */
export const PUT: APIRoute = async ({ params, request }) => {
  try {
    await requireSystemAdmin(request);

    const { id: userId } = params;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await request.json();
    const { roleIds } = data;

    if (!Array.isArray(roleIds)) {
      return new Response(
        JSON.stringify({ error: 'roleIds must be an array' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify all role IDs exist
    const roles = await prisma.role.findMany({
      where: {
        id: {
          in: roleIds,
        },
      },
    });

    if (roles.length !== roleIds.length) {
      return new Response(
        JSON.stringify({ error: 'One or more role IDs are invalid' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const nextRoleNames = new Set(roles.map((r) => r.name));

    // Losing Admin would lock everyone out if this is the last admin account.
    if (!nextRoleNames.has(ADMIN_ROLE_NAME)) {
      const wasAdmin = await prisma.userRole.findFirst({ where: { userId, role: { name: ADMIN_ROLE_NAME } } });
      if (wasAdmin) {
        const otherAdmins = await prisma.userRole.count({ where: { role: { name: ADMIN_ROLE_NAME }, userId: { not: userId } } });
        if (otherAdmins === 0) {
          return new Response(
            JSON.stringify({ error: 'This is the last admin account — it must keep the Admin role.' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Remove all existing roles for this user
    await prisma.userRole.deleteMany({
      where: { userId },
    });

    // Add new roles
    if (roleIds.length > 0) {
      await prisma.userRole.createMany({
        data: roleIds.map((roleId: string) => ({ userId, roleId })),
      });
    }

    // A coach's club scope only makes sense while they hold the role — drop it
    // once Team Coach is removed rather than leaving stale TeamOwnership rows.
    if (!nextRoleNames.has(COACH_ROLE_NAME)) {
      await prisma.teamOwnership.updateMany({
        where: { userId, role: COACH_ROLE_NAME, revokedAt: null },
        data: { revokedAt: new Date(), effectiveTo: new Date() },
      });
    }

    // Expire the cached permission set so the change takes effect immediately
    invalidatePermissionCache(userId);

    // Fetch updated user with roles
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    return new Response(
      JSON.stringify({
        user: {
          id: updatedUser!.id,
          email: updatedUser!.email,
          name: updatedUser!.name,
          roles: updatedUser!.userRoles.map(ur => ({
            id: ur.role.id,
            name: ur.role.name,
            description: ur.role.description,
          })),
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return handleApiError(error, 'assign user roles', request);
  }
};

/**
 * GET /api/users/[id]/role
 * Get user's roles
 */
export const GET: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'users:read');

    const { id: userId } = params;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        roles: user.userRoles.map(ur => ({
          id: ur.role.id,
          name: ur.role.name,
          description: ur.role.description,
          isSystem: ur.role.isSystem,
        })),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return handleApiError(error, 'fetch user roles', request);
  }
};
