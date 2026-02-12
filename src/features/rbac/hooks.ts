import { useState, useEffect } from 'react';

/**
 * Hook to check if user has a specific permission
 */
export function usePermission(permission: string): boolean {
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkPermission() {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          setHasPermission(false);
          return;
        }

        const data = await response.json();
        const permissions = data.user?.permissions || [];
        setHasPermission(permissions.includes(permission));
      } catch (error) {
        console.error('Error checking permission:', error);
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    }

    checkPermission();
  }, [permission]);

  return loading ? false : hasPermission;
}

/**
 * Hook to get all user permissions
 */
export function usePermissions(): string[] {
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    async function fetchPermissions() {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          setPermissions([]);
          return;
        }

        const data = await response.json();
        setPermissions(data.user?.permissions || []);
      } catch (error) {
        console.error('Error fetching permissions:', error);
        setPermissions([]);
      }
    }

    fetchPermissions();
  }, []);

  return permissions;
}

/**
 * Hook to check if user has ANY of the specified permissions
 */
export function useHasAnyPermission(permissions: string[]): boolean {
  const userPermissions = usePermissions();

  return permissions.some(perm => userPermissions.includes(perm));
}

/**
 * Hook to check if user has ALL of the specified permissions
 */
export function useHasAllPermissions(permissions: string[]): boolean {
  const userPermissions = usePermissions();

  return permissions.every(perm => userPermissions.includes(perm));
}

/**
 * Hook to check if user has a specific role
 */
export function useHasRole(roleName: string): boolean {
  const [hasRole, setHasRole] = useState(false);

  useEffect(() => {
    async function checkRole() {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          setHasRole(false);
          return;
        }

        const data = await response.json();
        const roles = data.user?.roles || [];
        setHasRole(roles.some((r: { name: string }) => r.name === roleName));
      } catch (error) {
        console.error('Error checking role:', error);
        setHasRole(false);
      }
    }

    checkRole();
  }, [roleName]);

  return hasRole;
}

/**
 * Hook to get all user roles
 */
export function useRoles(): Array<{ id: string; name: string; description?: string | null }> {
  const [roles, setRoles] = useState<Array<{ id: string; name: string; description?: string | null }>>([]);

  useEffect(() => {
    async function fetchRoles() {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          setRoles([]);
          return;
        }

        const data = await response.json();
        setRoles(data.user?.roles || []);
      } catch (error) {
        console.error('Error fetching roles:', error);
        setRoles([]);
      }
    }

    fetchRoles();
  }, []);

  return roles;
}
