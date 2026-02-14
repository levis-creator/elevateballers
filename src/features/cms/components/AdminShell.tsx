import { PermissionProvider } from '@/features/rbac/usePermissions';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

export default function AdminShell() {
  return (
    <PermissionProvider>
      <AdminSidebar />
      <AdminHeader />
    </PermissionProvider>
  );
}
