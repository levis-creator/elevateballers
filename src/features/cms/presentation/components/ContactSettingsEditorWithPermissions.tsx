import { PermissionProvider } from '@/features/rbac/usePermissions';
import ContactSettingsEditor from './ContactSettingsEditor';

export default function ContactSettingsEditorWithPermissions() {
  return (
    <PermissionProvider>
      <ContactSettingsEditor />
    </PermissionProvider>
  );
}
