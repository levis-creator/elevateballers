/**
 * UI Hooks - Main Export
 *
 * Re-exports the permissions system from the canonical RBAC module.
 *
 * @example
 * ```tsx
 * import { usePermissions } from '@/hooks';
 *
 * function MyComponent() {
 *   const { can, canEdit, isAdmin, loading } = usePermissions();
 *   if (canEdit('news_articles')) { ... }
 * }
 * ```
 */

export {
    usePermissions,
    usePermissionCheck,
    useRoleCheck,
    PermissionProvider,
    Can,
    HasRole,
    type UserWithPermissions,
} from './usePermissions';
