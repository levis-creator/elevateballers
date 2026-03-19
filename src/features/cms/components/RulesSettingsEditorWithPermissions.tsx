import { PermissionProvider } from '@/features/rbac/usePermissions';
import RulesSettingsEditor from './RulesSettingsEditor';

export default function RulesSettingsEditorWithPermissions() {
  return (
    <PermissionProvider>
      <RulesSettingsEditor />
    </PermissionProvider>
  );
}
