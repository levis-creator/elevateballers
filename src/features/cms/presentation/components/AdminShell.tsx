import { PermissionProvider } from '@/features/rbac/usePermissions';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { AdminShellProvider } from './AdminShellContext';

export default function AdminShell() {
  return (
    <ErrorBoundary>
      <PermissionProvider>
        <AdminShellProvider>
          <AdminSidebar />
          <AdminHeader />
        </AdminShellProvider>
      </PermissionProvider>
    </ErrorBoundary>
  );
}
