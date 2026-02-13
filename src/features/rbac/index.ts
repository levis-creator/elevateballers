/**
 * RBAC (Role-Based Access Control) Module
 *
 * This module provides a complete RBAC system for your application.
 *
 * @example Server-side usage
 * ```ts
 * import { hasPermission, getUserPermissions } from '@/features/rbac';
 *
 * const userPerms = await getUserPermissions(userId);
 * const canEdit = await hasPermission(userId, 'news_articles:edit');
 * ```
 *
 * @example Client-side usage
 * ```tsx
 * import { PermissionProvider, usePermissions, Can } from '@/features/rbac';
 *
 * // Wrap your app
 * <PermissionProvider>
 *   <App />
 * </PermissionProvider>
 *
 * // Use in components
 * const { can, canEdit, canView, isAdmin } = usePermissions();
 *
 * if (canEdit('news_articles')) { ... }
 * if (can('create', 'teams')) { ... }
 *
 * // Or use components
 * <Can action="edit" resource="news_articles">
 *   <button>Edit</button>
 * </Can>
 * ```
 */

// Server-side utilities
export {
  getUserPermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserWithPermissions,
  hasRole,
  hasAnyRole,
} from './permissions';

// Middleware (for API routes)
export {
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireRole,
  requireAnyRole,
  checkPermission,
  checkAnyPermission,
} from './middleware';

// Astro page helpers
export {
  requireRole as requireRolePage,
  requireAnyRole as requireAnyRolePage,
  requirePermissionPage,
  requireAdmin,
} from './auth-helpers';

// Client-side hooks and components
export {
  PermissionProvider,
  usePermissions,
  Can,
  HasRole,
  type UserWithPermissions,
} from './usePermissions';

// Legacy hooks (for backward compatibility)
export {
  usePermission,
  usePermissions as usePermissionsList,
  useHasAnyPermission,
  useHasAllPermissions,
  useHasRole,
  useRoles,
} from './hooks';
