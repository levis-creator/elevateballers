import { prisma } from '../../lib/prisma';

// ---------------------------------------------------------------------------
// Permission cache — eliminates N+1 DB queries on every authenticated request.
// Each user's full permission set is cached for CACHE_TTL_MS milliseconds.
// ---------------------------------------------------------------------------

const CACHE_TTL_MS = 60_000; // 1 minute

interface CacheEntry {
  permissions: Set<string>;
  expiresAt: number;
}

const permissionCache = new Map<string, CacheEntry>();

/** Force-expire a user's cache entry. Call after role/permission changes. */
export function invalidatePermissionCache(userId: string): void {
  permissionCache.delete(userId);
}

/** Prune stale entries every 5 minutes to prevent unbounded growth. */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of permissionCache) {
    if (now >= entry.expiresAt) permissionCache.delete(key);
  }
}, 5 * 60_000);

/**
 * Fetch (or return from cache) the full set of permissions for a user.
 * One DB query per user per TTL window — avoids N+1 on complex admin pages.
 */
async function getCachedPermissions(userId: string): Promise<Set<string>> {
  const now = Date.now();
  const cached = permissionCache.get(userId);

  if (cached && now < cached.expiresAt) {
    return cached.permissions;
  }

  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
    },
  });

  const permissions = new Set<string>();
  for (const userRole of userRoles) {
    for (const rp of userRole.role.permissions) {
      permissions.add(`${rp.permission.resource}:${rp.permission.action}`);
    }
  }

  permissionCache.set(userId, { permissions, expiresAt: now + CACHE_TTL_MS });
  return permissions;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get all permissions for a user (from all their roles).
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  const perms = await getCachedPermissions(userId);
  return Array.from(perms);
}

/**
 * Check if a user has a specific permission.
 */
export async function hasPermission(userId: string, permission: string): Promise<boolean> {
  if (!permission.includes(':')) {
    throw new Error(
      `Invalid permission format: "${permission}". Expected "resource:action".`
    );
  }
  const perms = await getCachedPermissions(userId);
  return perms.has(permission);
}

/**
 * Check if a user has ANY of the specified permissions.
 */
export async function hasAnyPermission(userId: string, permissions: string[]): Promise<boolean> {
  const perms = await getCachedPermissions(userId);
  return permissions.some((p) => perms.has(p));
}

/**
 * Check if a user has ALL of the specified permissions.
 */
export async function hasAllPermissions(userId: string, permissions: string[]): Promise<boolean> {
  const perms = await getCachedPermissions(userId);
  return permissions.every((p) => perms.has(p));
}

/**
 * Check if a user has a specific role.
 */
export async function hasRole(userId: string, roleName: string): Promise<boolean> {
  const count = await prisma.userRole.count({
    where: { userId, role: { name: roleName } },
  });
  return count > 0;
}

/**
 * Check if a user has ANY of the specified roles.
 */
export async function hasAnyRole(userId: string, roleNames: string[]): Promise<boolean> {
  const count = await prisma.userRole.count({
    where: { userId, role: { name: { in: roleNames } } },
  });
  return count > 0;
}

/**
 * Get user with their roles and permissions in a single optimised query.
 */
export async function getUserWithPermissions(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              permissions: { include: { permission: true } },
            },
          },
        },
      },
    },
  });

  if (!user) return null;

  const permissionsSet = new Set<string>();
  const roles = user.userRoles.map((ur) => {
    for (const rp of ur.role.permissions) {
      if (rp.permission) {
        permissionsSet.add(`${rp.permission.resource}:${rp.permission.action}`);
      }
    }
    return { id: ur.role.id, name: ur.role.name, description: ur.role.description };
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
