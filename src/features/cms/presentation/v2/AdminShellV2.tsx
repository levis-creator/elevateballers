import { PermissionProvider } from "@/features/rbac/usePermissions";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AdminShellProvider } from "@/features/cms/presentation/components/AdminShellContext";
import AdminSidebarV2 from "./AdminSidebarV2";
import AdminHeaderV2 from "./AdminHeaderV2";

/**
 * v2 admin shell: the fixed sidebar + topbar as a single island so they share
 * one PermissionProvider / AdminShellProvider (the Astro `<main>` slot is a
 * sibling and reads the collapse state via the `--admin-sidebar-width` CSS var
 * the provider maintains). Same provider composition as the v1 AdminShell.
 */
export default function AdminShellV2() {
	return (
		<ErrorBoundary>
			<PermissionProvider>
				<AdminShellProvider>
					<AdminSidebarV2 />
					<AdminHeaderV2 />
				</AdminShellProvider>
			</PermissionProvider>
		</ErrorBoundary>
	);
}
