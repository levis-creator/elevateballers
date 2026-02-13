import React from 'react';
import { usePermissions, Can, HasRole } from '../features/rbac/usePermissions';
import type { ReactNode } from 'react';

// Re-export the canonical Can and HasRole so existing imports from this file keep working
export { Can, HasRole };

/**
 * Props for permission-based components
 */
interface PermissionGateProps {
  children: ReactNode;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
}

/**
 * Props for resource-specific permission components
 */
interface ResourcePermissionProps extends PermissionGateProps {
  resource: string;
}

/**
 * Props for HasAnyRole component
 */
interface HasAnyRoleProps extends PermissionGateProps {
  roles: string[];
}

// ---------------------------------------------------------------------------
// Convenience wrappers — thin components over usePermissions()
// ---------------------------------------------------------------------------

function PermissionGate({
  check,
  children,
  fallback = null,
  loadingFallback = null,
}: PermissionGateProps & { check: () => boolean }) {
  const { loading } = usePermissions();

  if (loading && loadingFallback) return <>{loadingFallback}</>;
  if (loading) return null;

  return check() ? <>{children}</> : <>{fallback}</>;
}

export function CanView({ resource, children, fallback, loadingFallback }: ResourcePermissionProps) {
  const { canView } = usePermissions();
  return (
    <PermissionGate check={() => canView(resource)} fallback={fallback} loadingFallback={loadingFallback}>
      {children}
    </PermissionGate>
  );
}

export function CanCreate({ resource, children, fallback, loadingFallback }: ResourcePermissionProps) {
  const { canCreate } = usePermissions();
  return (
    <PermissionGate check={() => canCreate(resource)} fallback={fallback} loadingFallback={loadingFallback}>
      {children}
    </PermissionGate>
  );
}

export function CanEdit({ resource, children, fallback, loadingFallback }: ResourcePermissionProps) {
  const { canEdit } = usePermissions();
  return (
    <PermissionGate check={() => canEdit(resource)} fallback={fallback} loadingFallback={loadingFallback}>
      {children}
    </PermissionGate>
  );
}

export function CanDelete({ resource, children, fallback, loadingFallback }: ResourcePermissionProps) {
  const { canDelete } = usePermissions();
  return (
    <PermissionGate check={() => canDelete(resource)} fallback={fallback} loadingFallback={loadingFallback}>
      {children}
    </PermissionGate>
  );
}

export function CanManage({ resource, children, fallback, loadingFallback }: ResourcePermissionProps) {
  const { canManage } = usePermissions();
  return (
    <PermissionGate check={() => canManage(resource)} fallback={fallback} loadingFallback={loadingFallback}>
      {children}
    </PermissionGate>
  );
}

export function HasAnyRole({ roles, children, fallback, loadingFallback }: HasAnyRoleProps) {
  const { hasAnyRole } = usePermissions();
  return (
    <PermissionGate check={() => hasAnyRole(roles)} fallback={fallback} loadingFallback={loadingFallback}>
      {children}
    </PermissionGate>
  );
}

export function IsAdmin({ children, fallback, loadingFallback }: PermissionGateProps) {
  const { isAdmin } = usePermissions();
  return (
    <PermissionGate check={() => isAdmin} fallback={fallback} loadingFallback={loadingFallback}>
      {children}
    </PermissionGate>
  );
}

export function IsAuthenticated({ children, fallback, loadingFallback }: PermissionGateProps) {
  const { isAuthenticated } = usePermissions();
  return (
    <PermissionGate check={() => isAuthenticated} fallback={fallback} loadingFallback={loadingFallback}>
      {children}
    </PermissionGate>
  );
}

/**
 * Higher-order component to wrap a component with permission check
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  resource: string,
  action: string,
  fallback?: ReactNode
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
 */
export function withRole<P extends object>(
  Component: React.ComponentType<P>,
  role: string,
  fallback?: ReactNode
) {
  return function RoleWrappedComponent(props: P) {
    return (
      <HasRole role={role} fallback={fallback}>
        <Component {...props} />
      </HasRole>
    );
  };
}
