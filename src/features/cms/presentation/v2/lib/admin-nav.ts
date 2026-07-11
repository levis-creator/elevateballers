import type { ComponentType } from "react";
import {
	LayoutDashboard,
	MessageSquare,
	Mail,
	Trophy,
	CalendarRange,
	Calendar,
	Shield,
	Users,
	Briefcase,
	Newspaper,
	Star,
	Handshake,
	Images,
	ShieldCheck,
	FileText,
	Settings,
} from "lucide-react";

/**
 * Single source of truth for the admin sidebar navigation (v2). Pure data —
 * label / href / icon / RBAC gate per item — so the sidebar component is just
 * presentation. Mirrors the exact routes + permission strings the v1 sidebar
 * used, so nothing becomes reachable that wasn't before.
 */
export interface AdminNavItem {
	label: string;
	href: string;
	icon: ComponentType<{ className?: string }>;
	/** Requires this single permission. */
	permission?: string;
	/** Requires ANY of these permissions. */
	permissionsAny?: string[];
	/** Marks the item to show a live unread-count badge (contact messages). */
	badge?: "messages";
}

export interface AdminNavGroup {
	label: string;
	items: AdminNavItem[];
}

export const ADMIN_NAV: AdminNavGroup[] = [
	{
		label: "General",
		items: [
			{
				label: "Dashboard",
				href: "/admin",
				icon: LayoutDashboard,
				permissionsAny: [
					"news_articles:read",
					"matches:read",
					"players:read",
					"media:read",
					"teams:read",
					"leagues:read",
					"staff:read",
					"roles:read",
					"users:read",
					"audit_logs:read",
				],
			},
		],
	},
	{
		label: "Communication",
		items: [
			{ label: "Messages", href: "/admin/messages", icon: MessageSquare, permission: "contact_messages:read", badge: "messages" },
			{ label: "Subscribers", href: "/admin/subscribers", icon: Mail, permission: "subscribers:read" },
		],
	},
	{
		label: "Competition",
		items: [
			{ label: "Leagues", href: "/admin/leagues", icon: Trophy, permission: "leagues:read" },
			{ label: "Seasons", href: "/admin/seasons", icon: CalendarRange, permission: "seasons:read" },
			{ label: "Matches", href: "/admin/matches", icon: Calendar, permission: "matches:read" },
			{ label: "Teams", href: "/admin/teams", icon: Shield, permission: "teams:read" },
		],
	},
	{
		label: "Personnel",
		items: [
			{ label: "Players", href: "/admin/players", icon: Users, permission: "players:read" },
			{ label: "Staff", href: "/admin/staff", icon: Briefcase, permission: "staff:read" },
			{ label: "League Staff", href: "/admin/league-staff", icon: Briefcase, permission: "staff:read" },
		],
	},
	{
		label: "Editorial",
		items: [
			{ label: "News Articles", href: "/admin/news", icon: Newspaper, permission: "news_articles:read" },
			{ label: "Player of the Week", href: "/admin/highlights/potw", icon: Star, permission: "potw:read" },
			{ label: "Sponsors", href: "/admin/highlights/sponsors", icon: Handshake, permission: "sponsors:read" },
		],
	},
	{
		label: "Assets",
		items: [{ label: "Media Library", href: "/admin/media", icon: Images, permission: "media:read" }],
	},
	{
		label: "System",
		items: [
			{ label: "Users", href: "/admin/users", icon: Users, permission: "users:read" },
			{ label: "Roles & Permissions", href: "/admin/roles", icon: ShieldCheck, permission: "roles:read" },
			{ label: "Audit Logs", href: "/admin/audit-logs", icon: FileText, permissionsAny: ["audit_logs:read", "audit_logs:manage"] },
			{ label: "Settings", href: "/admin/settings", icon: Settings, permissionsAny: ["site_settings:read", "site_settings:manage"] },
		],
	},
];

/** Active-route test: exact match for `/admin`, prefix match for the rest. */
export function isNavItemActive(href: string, pathname: string): boolean {
	if (href === "/admin") return pathname === "/admin";
	return pathname === href || pathname.startsWith(href + "/");
}
