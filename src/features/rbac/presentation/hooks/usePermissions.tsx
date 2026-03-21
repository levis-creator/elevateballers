import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

/**
 * User with roles and permissions
 */
export interface UserWithPermissions {
  id: string;
  email: string;
  name: string;
  roles: Array<{ id: string; name: string; description?: string | null }>;
  permissions: string[];
}

/**
 * Permission context value
 */
interface PermissionContextValue {
  user: UserWithPermissions | null;
  permissions: string[];
  roles: string[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// sessionStorage cache — stale-while-revalidate
// ---------------------------------------------------------------------------

const CACHE_KEY = 'eb_permissions';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CachedPermissions {
  user: UserWithPermissions;
  timestamp: number;
}

function readCache(): UserWithPermissions | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedPermissions = JSON.parse(raw);
    // Reject if older than TTL (force fresh fetch)
    if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    return cached.user;
  } catch {
    return null;
  }
}

function writeCache(user: UserWithPermissions) {
  try {
    const entry: CachedPermissions = { user, timestamp: Date.now() };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // sessionStorage full or unavailable — silently ignore
  }
}

/** Clear the permission cache. Call this on logout. */
export function clearPermissionCache() {
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/**
 * Permission Provider - Wrap your app with this to enable permission checking.
 *
 * Uses a stale-while-revalidate strategy:
 * - On mount, immediately hydrates from sessionStorage (no loading flash)
 * - Revalidates in the background against /api/auth/me
 * - Cache expires after 5 minutes, forcing a fresh blocking fetch
 */
export function PermissionProvider({ children }: { children: ReactNode }) {
  const cached = readCache();
  const [user, setUser] = useState<UserWithPermissions | null>(cached);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<Error | null>(null);

  const fetchPermissions = async (background = false) => {
    try {
      if (!background) {
        setLoading(true);
      }
      setError(null);
      const response = await fetch('/api/auth/me');

      if (!response.ok) {
        if (response.status === 401) {
          setUser(null);
          clearPermissionCache();
          return;
        }
        throw new Error('Failed to fetch user permissions');
      }

      const data = await response.json();
      setUser(data.user);
      if (data.user) {
        writeCache(data.user);
      } else {
        clearPermissionCache();
      }
    } catch (err) {
      // Only surface errors on foreground fetches; background failures
      // are silent (we already have cached data).
      if (!background) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setUser(null);
        clearPermissionCache();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cached) {
      // We have cached data — revalidate in background
      fetchPermissions(true);
    } else {
      // No cache — blocking fetch
      fetchPermissions(false);
    }
  }, []);

  const value: PermissionContextValue = {
    user,
    permissions: user?.permissions || [],
    roles: user?.roles.map(r => r.name) || [],
    loading,
    error,
    refetch: () => fetchPermissions(false),
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

/**
 * Hook to access permission context.
 * Must be used within PermissionProvider.
 */
function usePermissionContext() {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissionContext must be used within a PermissionProvider');
  }
  return context;
}

/**
 * Primary permissions hook. Provides all permission and role checking utilities.
 *
 * @example
 * ```tsx
 * const { can, canEdit, canView, isAdmin, loading } = usePermissions();
 *
 * // Primary format: can('resource:action')
 * if (can('news_articles:edit')) { ... }
 *
 * // Convenience helpers
 * if (canEdit('news_articles')) { ... }
 * if (isAdmin) { ... }
 * ```
 */
export function usePermissions() {
  const { user, permissions, roles, loading, error, refetch } = usePermissionContext();

  /**
   * Check if user has a specific permission.
   *
   * Accepts two formats:
   *   can('resource:action')       - preferred
   *   can('action', 'resource')    - Laravel-style convenience
   */
  const can = useCallback((actionOrPermission: string, resource?: string): boolean => {
    if (loading || !user) return false;

    const permission = resource
      ? `${resource}:${actionOrPermission}`
      : actionOrPermission;

    return permissions.includes(permission);
  }, [user, permissions, loading]);

  const canView = useCallback((resource: string): boolean => {
    return can(`${resource}:read`) || can(`${resource}:view`);
  }, [can]);

  const canCreate = useCallback((resource: string): boolean => {
    return can(`${resource}:create`);
  }, [can]);

  const canEdit = useCallback((resource: string): boolean => {
    return can(`${resource}:edit`) || can(`${resource}:update`);
  }, [can]);

  const canDelete = useCallback((resource: string): boolean => {
    return can(`${resource}:delete`);
  }, [can]);

  const canUpdate = useCallback((resource: string): boolean => {
    return can(`${resource}:update`) || can(`${resource}:edit`);
  }, [can]);

  const canPublish = useCallback((resource: string): boolean => {
    return can(`${resource}:publish`);
  }, [can]);

  const canApprove = useCallback((resource: string): boolean => {
    return can(`${resource}:approve`);
  }, [can]);

  const canManage = useCallback((resource: string): boolean => {
    return can(`${resource}:manage`) || (
      canView(resource) &&
      canCreate(resource) &&
      canEdit(resource) &&
      canDelete(resource)
    );
  }, [can, canView, canCreate, canEdit, canDelete]);

  /** Check if user has ANY of the specified permissions (resource:action strings). */
  const canAny = useCallback((permissionsToCheck: string[]): boolean => {
    if (loading || !user) return false;
    return permissionsToCheck.some(perm => permissions.includes(perm));
  }, [user, permissions, loading]);

  const hasAnyPermission = canAny;

  /** Check if user has ALL of the specified permissions. */
  const canAll = useCallback((permissionsToCheck: string[]): boolean => {
    if (loading || !user) return false;
    return permissionsToCheck.every(perm => permissions.includes(perm));
  }, [user, permissions, loading]);

  const hasAllPermissions = canAll;

  const hasRole = useCallback((roleName: string): boolean => {
    if (loading || !user) return false;
    return roles.includes(roleName);
  }, [user, roles, loading]);

  const hasAnyRole = useCallback((roleNames: string[]): boolean => {
    if (loading || !user) return false;
    return roleNames.some(role => roles.includes(role));
  }, [user, roles, loading]);

  const hasAllRoles = useCallback((roleNames: string[]): boolean => {
    if (loading || !user) return false;
    return roleNames.every(role => roles.includes(role));
  }, [user, roles, loading]);

  const isAdmin = hasRole('Admin');
  const isAuthenticated = !!user;

  const getAllPermissions = useCallback((): string[] => {
    return user?.permissions || [];
  }, [user]);

  const getAllRoles = useCallback(() => {
    return user?.roles || [];
  }, [user]);

  const getUser = useCallback(() => {
    return user;
  }, [user]);

  const isSuperAdmin = useCallback((): boolean => {
    return hasRole('Super Admin');
  }, [hasRole]);

  const isEditor = useCallback((): boolean => {
    return hasRole('Editor');
  }, [hasRole]);

  return {
    // User data
    user,
    permissions,
    roles,
    loading,
    error,
    refetch,

    // Permission checking
    can,
    canView,
    canCreate,
    canEdit,
    canDelete,
    canUpdate,
    canPublish,
    canApprove,
    canManage,
    canAny,
    canAll,
    hasAnyPermission,
    hasAllPermissions,

    // Role checking
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isAdmin,
    isAuthenticated,
    isSuperAdmin,
    isEditor,

    // Data getters
    getAllPermissions,
    getAllRoles,
    getUser,
  };
}

// ---------------------------------------------------------------------------
// Declarative components
// ---------------------------------------------------------------------------

interface CanProps {
  permission?: string;
  action?: string;
  resource?: string;
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Declarative permission gate component.
 *
 * @example
 * ```tsx
 * <Can permission="news_articles:edit">
 *   <button>Edit</button>
 * </Can>
 *
 * <Can action="edit" resource="news_articles" fallback={<p>No access</p>}>
 *   <button>Edit</button>
 * </Can>
 * ```
 */
export function Can({ permission, action, resource, fallback = null, children }: CanProps) {
  const { can } = usePermissions();

  let hasPermission = false;

  if (permission) {
    hasPermission = can(permission);
  } else if (action && resource) {
    hasPermission = can(action, resource);
  } else {
    console.warn('Can component requires either "permission" or both "action" and "resource" props');
  }

  return hasPermission ? <>{children}</> : <>{fallback}</>;
}

interface HasRoleProps {
  role?: string;
  roles?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Declarative role gate component.
 *
 * @example
 * ```tsx
 * <HasRole role="Admin">
 *   <AdminPanel />
 * </HasRole>
 *
 * <HasRole roles={['Admin', 'Editor']} requireAll={false}>
 *   <ContentTools />
 * </HasRole>
 * ```
 */
export function HasRole({ role, roles, requireAll = false, fallback = null, children }: HasRoleProps) {
  const { hasRole, hasAnyRole, hasAllRoles } = usePermissions();

  let hasRequiredRole = false;

  if (role) {
    hasRequiredRole = hasRole(role);
  } else if (roles) {
    hasRequiredRole = requireAll ? hasAllRoles(roles) : hasAnyRole(roles);
  } else {
    console.warn('HasRole component requires either "role" or "roles" prop');
  }

  return hasRequiredRole ? <>{children}</> : <>{fallback}</>;
}
