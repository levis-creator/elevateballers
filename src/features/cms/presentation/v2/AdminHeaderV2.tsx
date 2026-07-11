import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { navigate } from "astro:transitions/client";
import { Menu, Search, Plus, Sun, Moon, Bell, ChevronDown, Newspaper, Calendar, Users, Shield, Upload, Settings, User, LogOut } from "lucide-react";
import { usePermissions, clearPermissionCache } from "@/features/rbac/usePermissions";
import { useAdminShell } from "@/features/cms/presentation/components/AdminShellContext";
import { ADMIN_NAV } from "./lib/admin-nav";
import { useAdminTheme } from "./hooks/useAdminTheme";
import { useAdminNotifications } from "./hooks/useAdminNotifications";

interface CreateLink {
	label: string;
	href: string;
	icon: typeof Newspaper;
	permission: string;
}
const CREATE_LINKS: CreateLink[] = [
	{ label: "New Article", href: "/admin/news/new", icon: Newspaper, permission: "news_articles:create" },
	{ label: "New Match", href: "/admin/matches/new", icon: Calendar, permission: "matches:create" },
	{ label: "New Player", href: "/admin/players/new", icon: Users, permission: "players:create" },
	{ label: "New Team", href: "/admin/teams/new", icon: Shield, permission: "teams:create" },
	{ label: "Upload Media", href: "/admin/media", icon: Upload, permission: "media:create" },
];

/**
 * v2 admin topbar. Presentation + light local UI state (open menus). Reuses the
 * shell context (sidebar toggle), permissions, the theme hook, and the shared
 * notifications hook. Logout mirrors the existing flow.
 */
export default function AdminHeaderV2() {
	const { user, roles, can } = usePermissions();
	const { toggleSidebar } = useAdminShell();
	const { theme, toggle: toggleTheme } = useAdminTheme();
	const notif = useAdminNotifications(can("notifications:read"));

	const [menu, setMenu] = useState<null | "create" | "notifs" | "user">(null);
	const [query, setQuery] = useState("");
	const rootRef = useRef<HTMLDivElement>(null);

	// Close any open menu on outside click.
	useEffect(() => {
		if (!menu) return;
		const onDown = (e: MouseEvent) => {
			if (rootRef.current && !rootRef.current.contains(e.target as Node)) setMenu(null);
		};
		document.addEventListener("mousedown", onDown);
		return () => document.removeEventListener("mousedown", onDown);
	}, [menu]);

	const createLinks = CREATE_LINKS.filter((l) => can(l.permission));

	// Lightweight quick-nav: Enter jumps to the first nav item matching the query.
	const onSearchKey = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key !== "Enter") return;
		const q = query.trim().toLowerCase();
		if (!q) return;
		const match = ADMIN_NAV.flatMap((g) => g.items).find((i) => i.label.toLowerCase().includes(q));
		if (match) {
			setQuery("");
			navigate(match.href);
		}
	};

	const handleLogout = async () => {
		try {
			clearPermissionCache();
			await fetch("/api/auth/logout", { method: "POST" });
		} catch {
			/* ignore */
		}
		window.location.href = "/admin/login";
	};

	const initial = user?.name?.charAt(0)?.toUpperCase() || "?";
	const iconBtn =
		"flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[var(--bord)] bg-[var(--surf2)] text-[var(--txd)] hover:border-[var(--brand)] hover:text-[var(--brand)]";

	return (
		<header
			ref={rootRef}
			className="fixed left-[var(--admin-sidebar-width,260px)] right-0 top-0 z-30 flex h-[57px] items-center gap-4 border-b border-[var(--bord2)] bg-[var(--topbar)] px-6 transition-[left] duration-[280ms] ease-out max-md:left-0 max-md:px-4"
		>
			<button type="button" onClick={toggleSidebar} aria-label="Toggle sidebar" className={iconBtn}>
				<span className="flex flex-col gap-[3px]">
					<Menu className="h-4 w-4" />
				</span>
			</button>

			<div className="flex min-w-0 max-w-[360px] flex-1 items-center gap-2.5 rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-3 py-2 max-[720px]:hidden">
				<Search className="h-[15px] w-[15px] flex-shrink-0 text-[var(--txm)]" />
				<input
					type="text"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					onKeyDown={onSearchKey}
					placeholder="Jump to players, teams, articles…"
					className="w-full border-none bg-transparent font-['Archivo'] text-[13px] text-[var(--tx)] outline-none placeholder:text-[var(--faint)]"
				/>
			</div>

			<div className="ml-auto flex items-center gap-2.5">
				{/* Create */}
				{createLinks.length > 0 && (
					<div className="relative">
						<button
							type="button"
							onClick={() => setMenu((m) => (m === "create" ? null : "create"))}
							aria-haspopup="true"
							className="flex cursor-pointer items-center gap-2 rounded-lg bg-[var(--brand)] px-3.5 py-2 font-['Archivo'] text-[12px] font-extrabold uppercase tracking-[0.04em] text-white hover:bg-[var(--brandlt)]"
						>
							<Plus className="h-[14px] w-[14px]" />
							<span className="max-[600px]:hidden">Create</span>
							<ChevronDown className="h-3 w-3 max-[600px]:hidden" />
						</button>
						{menu === "create" && (
							<div className="absolute right-0 z-50 mt-2 w-[224px] overflow-hidden rounded-xl border border-[var(--bord)] bg-[var(--surf)] shadow-[0_18px_50px_rgba(0,0,0,0.5)]">
								<div className="border-b border-[var(--bord2)] px-3.5 py-2.5 font-['Space_Mono'] text-[10px] uppercase tracking-[0.14em] text-[var(--txm)]">New content</div>
								{createLinks.map((l) => {
									const Icon = l.icon;
									return (
										<a key={l.href} href={l.href} className="group flex w-full items-center gap-3 px-3.5 py-2.5 text-left no-underline hover:bg-[var(--hov)]">
											<span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--brand)]/[0.12] text-[var(--brand)]">
												<Icon className="h-[15px] w-[15px]" />
											</span>
											<span className="flex-1 font-['Archivo'] text-[13px] font-bold text-[var(--tx)]">{l.label}</span>
											<span className="font-['Space_Mono'] text-[11px] text-[var(--faint)] group-hover:text-[var(--brand)]">→</span>
										</a>
									);
								})}
							</div>
						)}
					</div>
				)}

				{/* Theme */}
				<button type="button" onClick={toggleTheme} aria-label="Toggle light or dark mode" title={theme === "dark" ? "Switch to light" : "Switch to dark"} className={iconBtn}>
					{theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
				</button>

				{/* Notifications */}
				{can("notifications:read") && (
					<div className="relative">
						<button type="button" onClick={() => setMenu((m) => (m === "notifs" ? null : "notifs"))} aria-label="Notifications" className={`relative ${iconBtn}`}>
							<Bell className="h-4 w-4" />
							{notif.unreadCount > 0 && <span className="absolute right-1.5 top-1.5 h-[6px] w-[6px] rounded-full bg-[var(--brand)] ring-2 ring-[var(--topbar)]" />}
						</button>
						{menu === "notifs" && (
							<div className="absolute right-0 z-50 mt-2 w-[320px] overflow-hidden rounded-xl border border-[var(--bord)] bg-[var(--surf)] shadow-[0_18px_50px_rgba(0,0,0,0.5)]">
								<div className="flex items-center justify-between border-b border-[var(--bord2)] px-4 py-3">
									<span className="font-['Anton'] text-[15px] uppercase tracking-[0.02em] text-[var(--tx)]">Notifications</span>
									<a href="/admin/notifications" className="font-['Space_Mono'] text-[11px] text-[var(--brandsoft)] no-underline">View all →</a>
								</div>
								<div className="max-h-[360px] overflow-y-auto eb-scroll">
									{notif.notifications.length === 0 ? (
										<div className="px-4 py-8 text-center font-['Archivo'] text-[13px] text-[var(--txm)]">You&rsquo;re all caught up.</div>
									) : (
										notif.notifications.map((n) => (
											<button key={n.id} type="button" onClick={() => notif.open(n)} className="flex w-full items-start gap-3 border-b border-[var(--bord2)] px-4 py-3 text-left last:border-b-0 hover:bg-[var(--hov)]">
												<span className={`mt-1 h-[7px] w-[7px] flex-shrink-0 rounded-full ${n.read ? "bg-[var(--faint)]" : "bg-[var(--brand)]"}`} />
												<span className="min-w-0 flex-1">
													<span className="block font-['Archivo'] text-[12.5px] leading-snug text-[var(--txd)]">{n.message}</span>
												</span>
											</button>
										))
									)}
								</div>
							</div>
						)}
					</div>
				)}

				{/* User */}
				<div className="relative">
					<button
						type="button"
						onClick={() => setMenu((m) => (m === "user" ? null : "user"))}
						className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--bord)] bg-[var(--surf2)] py-1.5 pl-1.5 pr-3 hover:border-[var(--brand)]"
					>
						<span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--brand)] font-['Anton'] text-[13px] leading-none text-white">{initial}</span>
						<span className="font-['Archivo'] text-[12.5px] font-bold text-[var(--tx)] max-[600px]:hidden">{user?.name?.split(" ")[0] || "User"}</span>
						<ChevronDown className="h-3 w-3 text-[var(--txm)]" />
					</button>
					{menu === "user" && (
						<div className="absolute right-0 z-50 mt-2 w-[240px] overflow-hidden rounded-xl border border-[var(--bord)] bg-[var(--surf)] shadow-[0_18px_50px_rgba(0,0,0,0.5)]">
							<div className="border-b border-[var(--bord2)] px-4 py-3">
								<div className="font-['Archivo'] text-[13px] font-bold text-[var(--tx)]">{user?.name || "User"}</div>
								<div className="truncate font-['Space_Mono'] text-[11px] text-[var(--txm)]">{user?.email}</div>
								{roles?.[0] && <div className="mt-1.5 inline-block rounded bg-[var(--brand)]/[0.12] px-2 py-0.5 font-['Space_Mono'] text-[10px] uppercase tracking-[0.06em] text-[var(--brand)]">{roles[0]}</div>}
							</div>
							<a href="/admin/settings" className="flex items-center gap-2.5 px-4 py-2.5 font-['Archivo'] text-[13px] text-[var(--txd)] no-underline hover:bg-[var(--hov)]"><Settings className="h-4 w-4" />Settings</a>
							<a href="/admin/notification-settings" className="flex items-center gap-2.5 px-4 py-2.5 font-['Archivo'] text-[13px] text-[var(--txd)] no-underline hover:bg-[var(--hov)]"><Bell className="h-4 w-4" />Notifications</a>
							<a href="/admin/profile" className="flex items-center gap-2.5 px-4 py-2.5 font-['Archivo'] text-[13px] text-[var(--txd)] no-underline hover:bg-[var(--hov)]"><User className="h-4 w-4" />My Profile</a>
							<button type="button" onClick={handleLogout} className="flex w-full items-center gap-2.5 border-t border-[var(--bord2)] px-4 py-2.5 text-left font-['Archivo'] text-[13px] text-[var(--brand)] hover:bg-[var(--hov)]"><LogOut className="h-4 w-4" />Log out</button>
						</div>
					)}
				</div>
			</div>
		</header>
	);
}
