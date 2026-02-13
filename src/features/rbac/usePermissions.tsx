import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

/**
 * Permission Provider - Wrap your app with this to enable permission checking
 *
 * @example
 * ```tsx
 * <PermissionProvider>
 *   <App />
 * </PermissionProvider>
 * ```
 */
export function PermissionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserWithPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/auth/me');

      if (!response.ok) {
        if (response.status === 401) {
          setUser(null);
          return;
        }
        throw new Error('Failed to fetch user permissions');
      }

      const data = await response.json();
      setUser(data.user);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const value: PermissionContextValue = {
    user,
    permissions: user?.permissions || [],
    roles: user?.roles.map(r => r.name) || [],
    loading,
    error,
    refetch: fetchPermissions,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

/**
 * Hook to access permission context
 * Must be used within PermissionProvider
 */
function usePermissionContext() {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissionContext must be used within a PermissionProvider');
  }
  return context;
}

/**
 * Laravel-style permission hook
 *
 * @example
 * ```tsx
 * const { can, canEdit, canView, canCreate, canDelete, hasRole, isAdmin } = usePermissions();
 *
 * // Laravel-style: can('action', 'resource') or can('resource:action')
 * if (can('edit', 'news_articles')) { ... }
 * if (can('news_articles:edit')) { ... }
 *
 * // Simplified helpers
 * if (canEdit('news_articles')) { ... }
 * if (canView('users')) { ... }
 * if (canCreate('teams')) { ... }
 * if (canDelete('matches')) { ... }
 *
 * // Role checking
 * if (hasRole('Admin')) { ... }
 * if (isAdmin) { ... }
 * ```
 */
export function usePermissions() {
  const { user, permissions, roles, loading, error, refetch } = usePermissionContext();

  /**
   * Check if user has a specific permission
   * Supports both formats:
   * - can('edit', 'news_articles')
   * - can('news_articles:edit')
   */
  const can = (actionOrPermission: string, resource?: string): boolean => {
    if (loading) return false;
    if (!user) return false;

    let permission: string;

    if (resource) {
      // Laravel-style: can('edit', 'news_articles')
      permission = `${resource}:${actionOrPermission}`;
    } else {
      // Direct format: can('news_articles:edit')
      permission = actionOrPermission;
    }

    return permissions.includes(permission);
  };

  /**
   * Check if user can edit a resource
   */
  const canEdit = (resource: string): boolean => {
    return can('edit', resource);
  };

  /**
   * Check if user can view/read a resource
   */
  const canView = (resource: string): boolean => {
    return can('read', resource);
  };

  /**
   * Check if user can create a resource
   */
  const canCreate = (resource: string): boolean => {
    return can('create', resource);
  };

  /**
   * Check if user can delete a resource
   */
  const canDelete = (resource: string): boolean => {
    return can('delete', resource);
  };

  /**
   * Check if user can update a resource (alias for canEdit)
   */
  const canUpdate = (resource: string): boolean => {
    return can('update', resource);
  };

  /**
   * Check if user has ANY of the specified permissions
   */
  const canAny = (permissionsToCheck: string[]): boolean => {
    if (loading) return false;
    if (!user) return false;
    return permissionsToCheck.some(perm => permissions.includes(perm));
  };

  /**
   * Check if user has ALL of the specified permissions
   */
  const canAll = (permissionsToCheck: string[]): boolean => {
    if (loading) return false;
    if (!user) return false;
    return permissionsToCheck.every(perm => permissions.includes(perm));
  };

  /**
   * Check if user has a specific role
   */
  const hasRole = (roleName: string): boolean => {
    if (loading) return false;
    if (!user) return false;
    return roles.includes(roleName);
  };

  /**
   * Check if user has ANY of the specified roles
   */
  const hasAnyRole = (roleNames: string[]): boolean => {
    if (loading) return false;
    if (!user) return false;
    return roleNames.some(role => roles.includes(role));
  };

  /**
   * Check if user has ALL of the specified roles
   */
  const hasAllRoles = (roleNames: string[]): boolean => {
    if (loading) return false;
    if (!user) return false;
    return roleNames.every(role => roles.includes(role));
  };

  /**
   * Check if user is an admin
   */
  const isAdmin = hasRole('Admin');

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = !!user;

  return {
    // User data
    user,
    permissions,
    roles,
    loading,
    error,
    refetch,

    // Permission checking (Laravel-style)
    can,
    canEdit,
    canView,
    canCreate,
    canDelete,
    canUpdate,
    canAny,
    canAll,

    // Role checking
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isAdmin,
    isAuthenticated,
  };
}

/**
 * Component to conditionally render based on permissions
 *
 * @example
 * ```tsx
 * <Can permission="news_articles:edit">
 *   <button>Edit Article</button>
 * </Can>
 *
 * <Can action="edit" resource="news_articles">
 *   <button>Edit Article</button>
 * </Can>
 *
 * <Can action="edit" resource="news_articles" fallback={<div>No access</div>}>
 *   <button>Edit Article</button>
 * </Can>
 * ```
 */
interface CanProps {
  permission?: string;
  action?: string;
  resource?: string;
  fallback?: ReactNode;
  children: ReactNode;
}

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

/**
 * Component to conditionally render based on roles
 *
 * @example
 * ```tsx
 * <HasRole role="Admin">
 *   <button>Admin Only</button>
 * </HasRole>
 *
 * <HasRole roles={['Admin', 'Editor']} requireAll={false}>
 *   <button>Admin or Editor</button>
 * </HasRole>
 * ```
 */
interface HasRoleProps {
  role?: string;
  roles?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}

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
