import React from 'react';
import { usePermissions, usePermissionCheck, useRoleCheck } from '../hooks/usePermissions';

/**
 * Props for permission-based components
 */
interface PermissionGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loadingFallback?: React.ReactNode;
}

/**
 * Props for Can component
 */
interface CanProps extends PermissionGateProps {
  resource: string;
  action: string;
}

/**
 * Props for HasRole component
 */
interface HasRoleProps extends PermissionGateProps {
  role: string;
}

/**
 * Props for HasAnyRole component
 */
interface HasAnyRoleProps extends PermissionGateProps {
  roles: string[];
}

/**
 * Props for resource-specific permission components
 */
interface ResourcePermissionProps extends PermissionGateProps {
  resource: string;
}

/**
 * Component to conditionally render children based on permission
 * 
 * @example
 * ```tsx
 * <Can resource="news" action="edit">
 *   <EditButton />
 * </Can>
 * 
 * <Can resource="teams" action="delete" fallback={<p>No permission</p>}>
 *   <DeleteButton />
 * </Can>
 * ```
 */
export function Can({ resource, action, children, fallback = null, loadingFallback = null }: CanProps) {
  const { allowed, loading } = usePermissionCheck(resource, action);

  if (loading && loadingFallback) {
    return <>{loadingFallback}</>;
  }

  if (loading) {
    return null;
  }

  return allowed ? <>{children}</> : <>{fallback}</>;
}

/**
 * Component to conditionally render children if user can view resource
 * 
 * @example
 * ```tsx
 * <CanView resource="news">
 *   <NewsTable />
 * </CanView>
 * ```
 */
export function CanView({ resource, children, fallback = null, loadingFallback = null }: ResourcePermissionProps) {
  return (
    <Can resource={resource} action="view" fallback={fallback} loadingFallback={loadingFallback}>
      {children}
    </Can>
  );
}

/**
 * Component to conditionally render children if user can create resource
 * 
 * @example
 * ```tsx
 * <CanCreate resource="teams">
 *   <CreateTeamButton />
 * </CanCreate>
 * ```
 */
export function CanCreate({ resource, children, fallback = null, loadingFallback = null }: ResourcePermissionProps) {
  return (
    <Can resource={resource} action="create" fallback={fallback} loadingFallback={loadingFallback}>
      {children}
    </Can>
  );
}

/**
 * Component to conditionally render children if user can edit resource
 * 
 * @example
 * ```tsx
 * <CanEdit resource="players">
 *   <EditPlayerButton />
 * </CanEdit>
 * ```
 */
export function CanEdit({ resource, children, fallback = null, loadingFallback = null }: ResourcePermissionProps) {
  const permissions = usePermissions();
  const canEdit = permissions.canEdit(resource);
  const loading = permissions.loading;

  if (loading && loadingFallback) {
    return <>{loadingFallback}</>;
  }

  if (loading) {
    return null;
  }

  return canEdit ? <>{children}</> : <>{fallback}</>;
}

/**
 * Component to conditionally render children if user can delete resource
 * 
 * @example
 * ```tsx
 * <CanDelete resource="matches">
 *   <DeleteMatchButton />
 * </CanDelete>
 * ```
 */
export function CanDelete({ resource, children, fallback = null, loadingFallback = null }: ResourcePermissionProps) {
  return (
    <Can resource={resource} action="delete" fallback={fallback} loadingFallback={loadingFallback}>
      {children}
    </Can>
  );
}

/**
 * Component to conditionally render children if user can manage resource
 * 
 * @example
 * ```tsx
 * <CanManage resource="users">
 *   <UserManagementPanel />
 * </CanManage>
 * ```
 */
export function CanManage({ resource, children, fallback = null, loadingFallback = null }: ResourcePermissionProps) {
  const permissions = usePermissions();
  const canManage = permissions.canManage(resource);
  const loading = permissions.loading;

  if (loading && loadingFallback) {
    return <>{loadingFallback}</>;
  }

  if (loading) {
    return null;
  }

  return canManage ? <>{children}</> : <>{fallback}</>;
}

/**
 * Component to conditionally render children based on role
 * 
 * @example
 * ```tsx
 * <HasRole role="Admin">
 *   <AdminPanel />
 * </HasRole>
 * ```
 */
export function HasRole({ role, children, fallback = null, loadingFallback = null }: HasRoleProps) {
  const { hasRole, loading } = useRoleCheck(role);

  if (loading && loadingFallback) {
    return <>{loadingFallback}</>;
  }

  if (loading) {
    return null;
  }

  return hasRole ? <>{children}</> : <>{fallback}</>;
}

/**
 * Component to conditionally render children if user has any of the specified roles
 * 
 * @example
 * ```tsx
 * <HasAnyRole roles={['Admin', 'Editor']}>
 *   <ContentManagement />
 * </HasAnyRole>
 * ```
 */
export function HasAnyRole({ roles, children, fallback = null, loadingFallback = null }: HasAnyRoleProps) {
  const permissions = usePermissions();
  const hasAnyRole = permissions.hasAnyRole(roles);
  const loading = permissions.loading;

  if (loading && loadingFallback) {
    return <>{loadingFallback}</>;
  }

  if (loading) {
    return null;
  }

  return hasAnyRole ? <>{children}</> : <>{fallback}</>;
}

/**
 * Component to conditionally render children if user is Admin
 * 
 * @example
 * ```tsx
 * <IsAdmin>
 *   <AdminSettings />
 * </IsAdmin>
 * ```
 */
export function IsAdmin({ children, fallback = null, loadingFallback = null }: PermissionGateProps) {
  return (
    <HasRole role="Admin" fallback={fallback} loadingFallback={loadingFallback}>
      {children}
    </HasRole>
  );
}

/**
 * Component to conditionally render children if user is authenticated
 * 
 * @example
 * ```tsx
 * <IsAuthenticated fallback={<LoginPrompt />}>
 *   <UserDashboard />
 * </IsAuthenticated>
 * ```
 */
export function IsAuthenticated({ children, fallback = null, loadingFallback = null }: PermissionGateProps) {
  const permissions = usePermissions();
  const isAuthenticated = permissions.isAuthenticated();
  const loading = permissions.loading;

  if (loading && loadingFallback) {
    return <>{loadingFallback}</>;
  }

  if (loading) {
    return null;
  }

  return isAuthenticated ? <>{children}</> : <>{fallback}</>;
}

/**
 * Higher-order component to wrap a component with permission check
 * 
 * @example
 * ```tsx
 * const ProtectedEditButton = withPermission(EditButton, 'news', 'edit');
 * ```
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  resource: string,
  action: string,
  fallback?: React.ReactNode
) {
  return function PermissionWrappedComponent(props: P) {
    return (
      <Can resource={resource} action={action} fallback={fallback}>
        <Component {...props} />
      </Can>
    );
  };
}

/**
 * Higher-order component to wrap a component with role check
 * 
 * @example
 * ```tsx
 * const AdminOnlyPanel = withRole(SettingsPanel, 'Admin');
 * ```
 */
export function withRole<P extends object>(
  Component: React.ComponentType<P>,
  role: string,
  fallback?: React.ReactNode
) {
  return function RoleWrappedComponent(props: P) {
    return (
      <HasRole role={role} fallback={fallback}>
        <Component {...props} />
      </HasRole>
    );
  };
}
