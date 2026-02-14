import { prisma } from '../../lib/prisma';

/**
 * Get all permissions for a user (from all their roles)
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  const permissions = new Set<string>();

  for (const userRole of userRoles) {
    for (const rolePermission of userRole.role.permissions) {
      const permName = `${rolePermission.permission.resource}:${rolePermission.permission.action}`;
      permissions.add(permName);
    }
  }

  return Array.from(permissions);
}

/**
 * Check if a user has a specific permission
 */
export async function hasPermission(
  userId: string,
  permission: string
): Promise<boolean> {
  const [resource, action] = permission.split(':');

  if (!resource || !action) {
    throw new Error(`Invalid permission format: ${permission}. Expected format: "resource:action"`);
  }

  const count = await prisma.userRole.count({
    where: {
      userId,
      role: {
        permissions: {
          some: {
            permission: {
              resource,
              action,
            },
          },
        },
      },
    },
  });

  return count > 0;
}

/**
 * Check if a user has ANY of the specified permissions
 */
export async function hasAnyPermission(
  userId: string,
  permissions: string[]
): Promise<boolean> {
  for (const permission of permissions) {
    if (await hasPermission(userId, permission)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if a user has ALL of the specified permissions
 */
export async function hasAllPermissions(
  userId: string,
  permissions: string[]
): Promise<boolean> {
  for (const permission of permissions) {
    if (!(await hasPermission(userId, permission))) {
      return false;
    }
  }
  return true;
}

/**
 * Get user with their roles and permissions in a single optimized query
 */
export async function getUserWithPermissions(userId: string) {
  // Use a single query to get everything we need
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  // Flatten roles and permissions in memory to avoid extra DB calls
  const permissionsSet = new Set<string>();
  const roles = user.userRoles.map(ur => {
    // Add all permissions from this role
    if (ur.role.permissions) {
      for (const rp of ur.role.permissions) {
        if (rp.permission) {
          permissionsSet.add(`${rp.permission.resource}:${rp.permission.action}`);
        }
      }
    }

    return {
      id: ur.role.id,
      name: ur.role.name,
      description: ur.role.description,
    };
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    roles,
    permissions: Array.from(permissionsSet),
  };
}

/**
 * Check if a user has a specific role
 */
export async function hasRole(userId: string, roleName: string): Promise<boolean> {
  const count = await prisma.userRole.count({
    where: {
      userId,
      role: {
        name: roleName,
      },
    },
  });

  return count > 0;
}

/**
 * Check if a user has ANY of the specified roles
 */
export async function hasAnyRole(userId: string, roleNames: string[]): Promise<boolean> {
  const count = await prisma.userRole.count({
    where: {
      userId,
      role: {
        name: {
          in: roleNames,
        },
      },
    },
  });

  return count > 0;
}
