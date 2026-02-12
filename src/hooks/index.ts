/**
 * UI Permissions System - Main Export
 * 
 * This module provides a comprehensive Laravel-style permissions system for the UI.
 * It integrates with the existing RBAC infrastructure and provides both hooks and
 * components for permission checking.
 * 
 * @example
 * ```tsx
 * // Using hooks
 * import { usePermissions } from '@/hooks/usePermissions';
 * 
 * function MyComponent() {
 *   const permissions = usePermissions();
 *   
 *   if (permissions.canEdit('news')) {
 *     return <EditButton />;
 *   }
 * }
 * 
 * // Using components
 * import { CanEdit } from '@/components/PermissionGate';
 * 
 * function MyComponent() {
 *   return (
 *     <CanEdit resource="news">
 *       <EditButton />
 *     </CanEdit>
 *   );
 * }
 * ```
 */

// Re-export hooks
export {
    usePermissions,
    usePermissionCheck,
    useRoleCheck,
} from './usePermissions';

// Re-export types if needed
export type {
    // Add any exported types here if you want to expose them
} from './usePermissions';
