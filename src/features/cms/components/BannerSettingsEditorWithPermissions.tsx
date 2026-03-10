import { PermissionProvider } from '@/features/rbac/usePermissions';
import BannerSettingsEditor from './BannerSettingsEditor';

export default function BannerSettingsEditorWithPermissions() {
  return (
    <PermissionProvider>
      <BannerSettingsEditor />
    </PermissionProvider>
  );
}
