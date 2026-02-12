import { useState, useEffect, useCallback } from 'react';

/**
 * User data structure returned from the API
 */
interface UserData {
    id: string;
    email: string;
    name: string;
    roles: Array<{
        id: string;
        name: string;
        description?: string | null;
    }>;
    permissions: string[];
}

/**
 * Permission check result with loading state
 */
interface PermissionCheckResult {
    allowed: boolean;
    loading: boolean;
}

/**
 * Laravel-style permissions hook for UI permission checks
 * 
 * Provides methods similar to Laravel's authorization:
 * - can(resource, action) - Check if user can perform action on resource
 * - canView(resource) - Check if user can view resource
 * - canCreate(resource) - Check if user can create resource
 * - canEdit(resource) - Check if user can edit/update resource
 * - canDelete(resource) - Check if user can delete resource
 * - canManage(resource) - Check if user can manage (all actions) on resource
 * - hasRole(roleName) - Check if user has specific role
 * - hasAnyRole(roleNames) - Check if user has any of the specified roles
 * - isAdmin() - Check if user has Admin role
 * - isSuperAdmin() - Check if user has Super Admin role
 * 
 * @example
 * ```tsx
 * const permissions = usePermissions();
 * 
 * if (permissions.canEdit('news')) {
 *   return <EditButton />;
 * }
 * 
 * if (permissions.canDelete('teams')) {
 *   return <DeleteButton />;
 * }
 * 
 * if (permissions.isAdmin()) {
 *   return <AdminPanel />;
 * }
 * ```
 */
export function usePermissions() {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Fetch user data with permissions and roles
    useEffect(() => {
        let isMounted = true;

        async function fetchUserData() {
            try {
                setLoading(true);
                const response = await fetch('/api/auth/me');

                if (!response.ok) {
                    if (isMounted) {
                        setUserData(null);
                        setError(new Error('Failed to fetch user data'));
                    }
                    return;
                }

                const data = await response.json();
                if (isMounted) {
                    setUserData(data.user || null);
                    setError(null);
                }
            } catch (err) {
                console.error('Error fetching user permissions:', err);
                if (isMounted) {
                    setUserData(null);
                    setError(err instanceof Error ? err : new Error('Unknown error'));
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        fetchUserData();

        return () => {
            isMounted = false;
        };
    }, []);

    /**
     * Check if user has a specific permission
     * @param resource - The resource name (e.g., 'news', 'teams', 'players')
     * @param action - The action name (e.g., 'view', 'create', 'edit', 'delete')
     * @returns true if user has the permission
     */
    const can = useCallback((resource: string, action: string): boolean => {
        if (!userData || loading) return false;
        const permission = `${resource}:${action}`;
        return userData.permissions.includes(permission);
    }, [userData, loading]);

    /**
     * Check if user can view a resource
     * @param resource - The resource name
     */
    const canView = useCallback((resource: string): boolean => {
        return can(resource, 'view');
    }, [can]);

    /**
     * Check if user can create a resource
     * @param resource - The resource name
     */
    const canCreate = useCallback((resource: string): boolean => {
        return can(resource, 'create');
    }, [can]);

    /**
     * Check if user can edit/update a resource
     * @param resource - The resource name
     */
    const canEdit = useCallback((resource: string): boolean => {
        return can(resource, 'edit') || can(resource, 'update');
    }, [can]);

    /**
     * Check if user can delete a resource
     * @param resource - The resource name
     */
    const canDelete = useCallback((resource: string): boolean => {
        return can(resource, 'delete');
    }, [can]);

    /**
     * Check if user can publish a resource
     * @param resource - The resource name
     */
    const canPublish = useCallback((resource: string): boolean => {
        return can(resource, 'publish');
    }, [can]);

    /**
     * Check if user can approve a resource
     * @param resource - The resource name
     */
    const canApprove = useCallback((resource: string): boolean => {
        return can(resource, 'approve');
    }, [can]);

    /**
     * Check if user can manage (all actions) on a resource
     * Checks for 'manage' permission or all CRUD permissions
     * @param resource - The resource name
     */
    const canManage = useCallback((resource: string): boolean => {
        return can(resource, 'manage') || (
            canView(resource) &&
            canCreate(resource) &&
            canEdit(resource) &&
            canDelete(resource)
        );
    }, [can, canView, canCreate, canEdit, canDelete]);

    /**
     * Check if user has ANY of the specified permissions
     * @param permissions - Array of permission strings in format "resource:action"
     */
    const hasAnyPermission = useCallback((permissions: string[]): boolean => {
        if (!userData || loading) return false;
        return permissions.some(perm => userData.permissions.includes(perm));
    }, [userData, loading]);

    /**
     * Check if user has ALL of the specified permissions
     * @param permissions - Array of permission strings in format "resource:action"
     */
    const hasAllPermissions = useCallback((permissions: string[]): boolean => {
        if (!userData || loading) return false;
        return permissions.every(perm => userData.permissions.includes(perm));
    }, [userData, loading]);

    /**
     * Check if user has a specific role
     * @param roleName - The role name (e.g., 'Admin', 'Editor')
     */
    const hasRole = useCallback((roleName: string): boolean => {
        if (!userData || loading) return false;
        return userData.roles.some(role => role.name === roleName);
    }, [userData, loading]);

    /**
     * Check if user has ANY of the specified roles
     * @param roleNames - Array of role names
     */
    const hasAnyRole = useCallback((roleNames: string[]): boolean => {
        if (!userData || loading) return false;
        return userData.roles.some(role => roleNames.includes(role.name));
    }, [userData, loading]);

    /**
     * Check if user has ALL of the specified roles
     * @param roleNames - Array of role names
     */
    const hasAllRoles = useCallback((roleNames: string[]): boolean => {
        if (!userData || loading) return false;
        return roleNames.every(roleName =>
            userData.roles.some(role => role.name === roleName)
        );
    }, [userData, loading]);

    /**
     * Check if user is an Admin
     */
    const isAdmin = useCallback((): boolean => {
        return hasRole('Admin');
    }, [hasRole]);

    /**
     * Check if user is a Super Admin
     */
    const isSuperAdmin = useCallback((): boolean => {
        return hasRole('Super Admin');
    }, [hasRole]);

    /**
     * Check if user is an Editor
     */
    const isEditor = useCallback((): boolean => {
        return hasRole('Editor');
    }, [hasRole]);

    /**
     * Get all user permissions
     */
    const getAllPermissions = useCallback((): string[] => {
        return userData?.permissions || [];
    }, [userData]);

    /**
     * Get all user roles
     */
    const getAllRoles = useCallback(() => {
        return userData?.roles || [];
    }, [userData]);

    /**
     * Get user data
     */
    const getUser = useCallback(() => {
        return userData;
    }, [userData]);

    /**
     * Check if user is authenticated
     */
    const isAuthenticated = useCallback((): boolean => {
        return !!userData && !loading;
    }, [userData, loading]);

    return {
        // Permission checks
        can,
        canView,
        canCreate,
        canEdit,
        canDelete,
        canPublish,
        canApprove,
        canManage,
        hasAnyPermission,
        hasAllPermissions,

        // Role checks
        hasRole,
        hasAnyRole,
        hasAllRoles,
        isAdmin,
        isSuperAdmin,
        isEditor,

        // Data getters
        getAllPermissions,
        getAllRoles,
        getUser,
        isAuthenticated,

        // State
        loading,
        error,
    };
}

/**
 * Hook to check a specific permission with loading state
 * Useful for conditional rendering with loading indicators
 * 
 * @example
 * ```tsx
 * const { allowed, loading } = usePermissionCheck('news', 'edit');
 * 
 * if (loading) return <Spinner />;
 * if (!allowed) return null;
 * return <EditButton />;
 * ```
 */
export function usePermissionCheck(resource: string, action: string): PermissionCheckResult {
    const { can, loading } = usePermissions();

    return {
        allowed: can(resource, action),
        loading,
    };
}

/**
 * Hook to check if user has a specific role with loading state
 * 
 * @example
 * ```tsx
 * const { hasRole: isAdmin, loading } = useRoleCheck('Admin');
 * 
 * if (loading) return <Spinner />;
 * if (!isAdmin) return <AccessDenied />;
 * return <AdminPanel />;
 * ```
 */
export function useRoleCheck(roleName: string): { hasRole: boolean; loading: boolean } {
    const { hasRole, loading } = usePermissions();

    return {
        hasRole: hasRole(roleName),
        loading,
    };
}
