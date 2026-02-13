/**
 * UI Permissions Hook - Re-exports from the canonical RBAC module
 *
 * All permission logic lives in src/features/rbac/usePermissions.tsx.
 * This file exists so existing `@/hooks/usePermissions` imports keep working.
 */

export {
    PermissionProvider,
    usePermissions,
    Can,
    HasRole,
    type UserWithPermissions,
} from '../features/rbac/usePermissions';

// Re-export helpers used by PermissionGate.tsx
import { usePermissions as _usePermissions } from '../features/rbac/usePermissions';

/**
 * Check a specific permission with loading state.
 * Thin wrapper around usePermissions() for components that only
 * need a single resource:action check.
 */
export function usePermissionCheck(
    resource: string,
    action: string
): { allowed: boolean; loading: boolean } {
    const { can, loading } = _usePermissions();
    return { allowed: can(`${resource}:${action}`), loading };
}

/**
 * Check if user has a specific role with loading state.
 */
export function useRoleCheck(
    roleName: string
): { hasRole: boolean; loading: boolean } {
    const perms = _usePermissions();
    return { hasRole: perms.hasRole(roleName), loading: perms.loading };
}
