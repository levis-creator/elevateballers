/**
 * RBAC Helper functions for Astro pages
 * Use these to protect Astro pages with role/permission checks
 */

import { getCurrentUser } from '../../../cms/lib/auth';
import { hasRole, hasPermission, hasAnyRole } from './permissions';

/**
 * Check if the current user has a specific role
 * Returns user if they have the role, redirects otherwise
 *
 * @example
 * ```astro
 * ---
 * import { requireRole } from '@/features/rbac/auth-helpers';
 * const user = await requireRole(Astro.request, 'Admin');
 * if (!user) return Astro.redirect('/admin/login', 302);
 * ---
 * ```
 */
export async function requireRole(request: Request, roleName: string) {
  const user = await getCurrentUser(request);
  if (!user) return null;

  const authorized = await hasRole(user.id, roleName);
  if (!authorized) return null;

  return user;
}

/**
 * Check if the current user has ANY of the specified roles
 * Returns user if they have at least one role, null otherwise
 *
 * @example
 * ```astro
 * ---
 * import { requireAnyRole } from '@/features/rbac/auth-helpers';
 * const user = await requireAnyRole(Astro.request, ['Admin', 'Editor']);
 * if (!user) return Astro.redirect('/admin/login', 302);
 * ---
 * ```
 */
export async function requireAnyRole(request: Request, roleNames: string[]) {
  const user = await getCurrentUser(request);
  if (!user) return null;

  const authorized = await hasAnyRole(user.id, roleNames);
  if (!authorized) return null;

  return user;
}

/**
 * Check if the current user has a specific permission
 * Returns user if they have the permission, null otherwise
 *
 * @example
 * ```astro
 * ---
 * import { requirePermission } from '@/features/rbac/auth-helpers';
 * const user = await requirePermission(Astro.request, 'users:read');
 * if (!user) return Astro.redirect('/unauthorized', 302);
 * ---
 * ```
 */
export async function requirePermissionPage(request: Request, permission: string) {
  const user = await getCurrentUser(request);
  if (!user) return null;

  const authorized = await hasPermission(user.id, permission);
  if (!authorized) return null;

  return user;
}

/**
 * Check if current user is admin
 * Returns user if admin, null otherwise
 *
 * @example
 * ```astro
 * ---
 * import { requireAdmin } from '@/features/rbac/auth-helpers';
 * const user = await requireAdmin(Astro.request);
 * if (!user) return Astro.redirect('/admin/login', 302);
 * ---
 * ```
 */
export async function requireAdmin(request: Request) {
  return requireRole(request, 'Admin');
}
