import { PermissionProvider } from '@/features/rbac/usePermissions';
import AboutPageEditor from './AboutPageEditor';

export default function AboutPageEditorWithPermissions() {
  return (
    <PermissionProvider>
      <AboutPageEditor />
    </PermissionProvider>
  );
}
