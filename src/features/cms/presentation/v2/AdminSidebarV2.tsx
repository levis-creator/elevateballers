import { useEffect, useState } from "react";
import { usePermissions, clearPermissionCache } from "@/features/rbac/usePermissions";
import { useAdminShell } from "@/features/cms/presentation/components/AdminShellContext";
import { usePathname } from "@/features/cms/presentation/hooks/usePathname";
import { ADMIN_NAV, isNavItemActive, type AdminNavItem } from "./lib/admin-nav";

/**
 * v2 admin sidebar. Presentation only — nav data comes from `admin-nav.ts`,
 * RBAC from `usePermissions`, collapse/mobile state from `useAdminShell`. Renders
 * real `<a>` links (works with the view-transitions router). Preserves the
 * existing logout flow and the live unread-messages badge.
 */
export default function AdminSidebarV2() {
	const { can, canAny, user, roles } = usePermissions();
	const { sidebarShown, isMobile, setSidebarOpen } = useAdminShell();
	const activePath = usePathname();
	const [unread, setUnread] = useState(0);

	// Live unread contact-messages badge (same source as the v1 sidebar).
	useEffect(() => {
		if (!can("contact_messages:read")) return;
		let cancelled = false;
		fetch("/api/contact-messages?unread=true")
			.then((r) => (r.ok ? r.json() : []))
			.then((d) => {
				if (!cancelled) setUnread(Array.isArray(d) ? d.length : 0);
			})
			.catch(() => {});
		return () => {
			cancelled = true;
		};
	}, [can]);

	const allowed = (item: AdminNavItem): boolean => {
		if (item.permission && !can(item.permission)) return false;
		if (item.permissionsAny && !canAny(item.permissionsAny)) return false;
		return true;
	};

	const handleLogout = async () => {
		if (!window.confirm("Are you sure you want to log out?")) return;
		try {
			clearPermissionCache();
			await fetch("/api/auth/logout", { method: "POST" });
		} catch {
			/* ignore */
		}
		window.location.href = "/admin/login";
	};

	const initial = user?.name?.charAt(0)?.toUpperCase() || "?";
	const roleLabel = roles?.[0] || "Member";

	return (
		<aside
			className={`eb-scroll fixed left-0 top-0 z-40 flex h-screen w-[260px] flex-shrink-0 flex-col overflow-y-auto overflow-x-hidden border-r border-[var(--bord2)] bg-[var(--sidebar)] transition-transform duration-[280ms] ease-out ${
				sidebarShown ? "translate-x-0" : "-translate-x-full"
			}`}
		>
			{/* three-point arc flourish */}
			<svg className="pointer-events-none absolute -right-[60px] top-[120px] h-[200px] w-[200px] opacity-40" viewBox="0 0 200 200" fill="none" aria-hidden>
				<path d="M200 20 A 130 130 0 0 0 20 200" stroke="rgba(228,0,43,0.5)" strokeWidth="2" fill="none" />
			</svg>

			{/* brand header */}
			<div className="sticky top-0 z-10 flex items-center gap-2.5 border-b border-[var(--bord2)] bg-[var(--sidebar)] px-5 py-[18px]">
				<span className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-lg bg-[var(--brand)] shadow-[0_6px_18px_rgba(228,0,43,0.4)]">
					<span className="font-['Anton'] text-[18px] leading-none text-white">E</span>
				</span>
				<span className="font-['Anton'] text-[17px] uppercase tracking-[0.06em] text-[var(--tx)]">
					Elevate <span className="text-[var(--brand)]">CMS</span>
				</span>
			</div>

			{/* nav */}
			<nav className="flex-1 px-3 py-4">
				{ADMIN_NAV.map((group) => {
					const items = group.items.filter(allowed);
					if (!items.length) return null;
					return (
						<div key={group.label} className="mb-4">
							<div className="mb-1.5 px-3 font-['Space_Mono'] text-[9.5px] uppercase tracking-[0.18em] text-[var(--faint)]">{group.label}</div>
							{items.map((item) => {
								const active = isNavItemActive(item.href, activePath);
								const Icon = item.icon;
								return (
									<a
										key={item.href}
										href={item.href}
										aria-current={active ? "page" : undefined}
										onClick={() => isMobile && setSidebarOpen(false)}
										className={`mb-0.5 flex items-center gap-[11px] rounded-[9px] px-[11px] py-[9px] font-['Archivo'] text-[13px] no-underline transition-colors ${
											active
												? "bg-[var(--brand)] font-bold text-white shadow-[0_6px_16px_rgba(228,0,43,0.35)]"
												: "font-medium text-[var(--txd)] hover:bg-[var(--hov)]"
										}`}
									>
										<Icon className={`h-[18px] w-[18px] flex-shrink-0 ${active ? "text-white" : "text-[var(--txm)]"}`} />
										<span className="flex-1 text-left">{item.label}</span>
										{item.badge === "messages" && unread > 0 && (
											<span className="rounded-full bg-[var(--brand)] px-[7px] py-px font-['Space_Mono'] text-[10px] font-bold leading-4 text-white">
												{unread > 99 ? "99+" : unread}
											</span>
										)}
									</a>
								);
							})}
						</div>
					);
				})}
			</nav>

			{/* user footer */}
			<div className="sticky bottom-0 border-t border-[var(--bord2)] bg-[var(--sidebar)] px-3 py-3.5">
				<div className="mb-2.5 flex items-center gap-2.5 px-2">
					<span className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-full bg-[var(--brand)] font-['Anton'] text-[15px] leading-none text-white">{initial}</span>
					<span className="min-w-0 flex-1">
						<span className="block truncate font-['Archivo'] text-[13px] font-bold text-[var(--tx)]">{user?.name || "User"}</span>
						<span className="block font-['Space_Mono'] text-[10px] uppercase tracking-[0.1em] text-[var(--txm)]">{roleLabel}</span>
					</span>
				</div>
				<div className="grid grid-cols-2 gap-2">
					<a
						href="/"
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center justify-center rounded-md border border-[var(--bord)] bg-[var(--surf2)] py-2 font-['Archivo'] text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--txd)] no-underline hover:border-[var(--brand)] hover:text-[var(--brand)]"
					>
						View Site
					</a>
					<button
						type="button"
						onClick={handleLogout}
						className="flex cursor-pointer items-center justify-center rounded-md border border-[var(--brand)]/40 bg-[var(--brand)]/[0.12] py-2 font-['Archivo'] text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--brand)] hover:bg-[var(--brand)]/20"
					>
						Logout
					</button>
				</div>
			</div>
		</aside>
	);
}
