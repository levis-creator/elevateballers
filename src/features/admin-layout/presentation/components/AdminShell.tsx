import { PermissionProvider } from '@/features/rbac/presentation/hooks/usePermissions';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

export default function AdminShell() {
  return (
    <ErrorBoundary>
      <PermissionProvider>
        <AdminSidebar />
        <AdminHeader />
      </PermissionProvider>
    </ErrorBoundary>
  );
}
