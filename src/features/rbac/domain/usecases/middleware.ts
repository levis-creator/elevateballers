import { getCurrentUser } from '../../../cms/lib/auth';
import type { User } from '../../../cms/types';
import { hasPermission, hasAnyPermission, hasAllPermissions, hasRole, hasAnyRole } from '../../data/datasources/permissions';

/**
 * Require user to have a specific permission
 * Throws error if user doesn't have permission
 */
export async function requirePermission(request: Request, permission: string): Promise<User> {
  const user = await getCurrentUser(request);

  if (!user) {
    throw new Error('Unauthorized: Authentication required');
  }

  const allowed = await hasPermission(user.id, permission);

  if (!allowed) {
    throw new Error(`Forbidden: Required permission "${permission}" not granted`);
  }

  return user;
}

/**
 * Require user to have ANY of the specified permissions
 * Throws error if user doesn't have at least one permission
 */
export async function requireAnyPermission(request: Request, permissions: string[]): Promise<User> {
  const user = await getCurrentUser(request);

  if (!user) {
    throw new Error('Unauthorized: Authentication required');
  }

  const allowed = await hasAnyPermission(user.id, permissions);

  if (!allowed) {
    throw new Error(`Forbidden: Required one of: ${permissions.join(', ')}`);
  }

  return user;
}

/**
 * Require user to have ALL of the specified permissions
 * Throws error if user doesn't have all permissions
 */
export async function requireAllPermissions(request: Request, permissions: string[]): Promise<User> {
  const user = await getCurrentUser(request);

  if (!user) {
    throw new Error('Unauthorized: Authentication required');
  }

  const allowed = await hasAllPermissions(user.id, permissions);

  if (!allowed) {
    throw new Error(`Forbidden: Required all of: ${permissions.join(', ')}`);
  }

  return user;
}

/**
 * Require user to have a specific role
 * Throws error if user doesn't have the role
 */
export async function requireRole(request: Request, roleName: string): Promise<User> {
  const user = await getCurrentUser(request);

  if (!user) {
    throw new Error('Unauthorized: Authentication required');
  }

  const allowed = await hasRole(user.id, roleName);

  if (!allowed) {
    throw new Error(`Forbidden: Required role "${roleName}"`);
  }

  return user;
}

/**
 * Require user to have ANY of the specified roles
 * Throws error if user doesn't have at least one role
 */
export async function requireAnyRole(request: Request, roleNames: string[]): Promise<User> {
  const user = await getCurrentUser(request);

  if (!user) {
    throw new Error('Unauthorized: Authentication required');
  }

  const allowed = await hasAnyRole(user.id, roleNames);

  if (!allowed) {
    throw new Error(`Forbidden: Required one of roles: ${roleNames.join(', ')}`);
  }

  return user;
}

/**
 * Check if current user has a permission (returns boolean, doesn't throw)
 */
export async function checkPermission(request: Request, permission: string): Promise<boolean> {
  try {
    const user = await getCurrentUser(request);
    if (!user) return false;
    return await hasPermission(user.id, permission);
  } catch {
    return false;
  }
}

/**
 * Check if current user has any of the permissions (returns boolean, doesn't throw)
 */
export async function checkAnyPermission(request: Request, permissions: string[]): Promise<boolean> {
  try {
    const user = await getCurrentUser(request);
    if (!user) return false;
    return await hasAnyPermission(user.id, permissions);
  } catch {
    return false;
  }
}
