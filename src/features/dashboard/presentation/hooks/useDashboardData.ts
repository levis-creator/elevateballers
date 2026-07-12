import { useCallback, useEffect, useState } from "react";
import { usePermissions } from "@/features/rbac/usePermissions";

/** Normalise the various admin list responses (`[]`, `{data:[]}`, `{total}`) to a count. */
async function countOf(url: string, allowed: boolean): Promise<number> {
	if (!allowed) return 0;
	try {
		const r = await fetch(url);
		if (!r.ok) return 0;
		const d = await r.json();
		if (Array.isArray(d)) return d.length;
		if (Array.isArray(d?.data)) return d.data.length;
		if (typeof d?.total === "number") return d.total;
		return 0;
	} catch {
		return 0;
	}
}

async function listOf(url: string, allowed: boolean): Promise<any[]> {
	if (!allowed) return [];
	try {
		const r = await fetch(url);
		if (!r.ok) return [];
		const d = await r.json();
		if (Array.isArray(d)) return d;
		if (Array.isArray(d?.data)) return d.data;
		if (Array.isArray(d?.logs)) return d.logs;
		if (Array.isArray(d?.items)) return d.items;
		return [];
	} catch {
		return [];
	}
}

export interface Kpi {
	key: string;
	label: string;
	value: number;
	href: string;
	tint: string;
}
export interface Fixture {
	id: string;
	home: string;
	away: string;
	date: string | null;
	status: string;
}
export interface Approval {
	id: string;
	tab: "Players" | "Teams" | "Messages";
	title: string;
	meta: string;
	entityId?: string;
}
export interface ActivityEvent {
	id: string;
	text: string;
	at: string;
}
export interface Leader {
	playerId: string;
	name: string;
	team: string;
	initials: string;
	value: number;
	gp: number;
	href: string;
}
export interface SeasonPulse {
	name: string;
	week: number;
	weeks: number;
	gamesThisWeek: number;
	played: number;
	total: number;
	pct: number;
	nextLabel: string;
}
export interface Storage {
	usedGb: number;
	items: number;
	pct: number;
}

const DAY = 86_400_000;
const teamName = (m: any, side: 1 | 2) => m?.[`team${side}`]?.name || m?.[`team${side}Name`] || `Team ${side}`;
const matchTime = (m: any): number => {
	const t = new Date(m?.date ?? 0).getTime();
	return Number.isFinite(t) ? t : 0;
};

function deriveSeason(seasons: any[], matches: any[]): SeasonPulse {
	const now = Date.now();
	// Prefer a season whose date range contains today; else the most recent.
	const withRange = seasons.filter((s) => s.startDate && s.endDate);
	const active =
		withRange.find((s) => new Date(s.startDate).getTime() <= now && now <= new Date(s.endDate).getTime()) ||
		withRange.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];

	const total = matches.length;
	const played = matches.filter((m) => String(m.status).toUpperCase() === "COMPLETED").length;
	const pct = total ? Math.round((played / total) * 100) : 0;

	let week = 1;
	let weeks = 1;
	let gamesThisWeek = 0;
	let name = active?.name || `Season ${new Date().getFullYear()}`;

	if (active?.startDate && active?.endDate) {
		const start = new Date(active.startDate).getTime();
		const end = new Date(active.endDate).getTime();
		weeks = Math.max(1, Math.ceil((end - start) / (7 * DAY)));
		week = Math.min(weeks, Math.max(1, Math.ceil((now - start) / (7 * DAY))));
		const weekStart = start + (week - 1) * 7 * DAY;
		const weekEnd = weekStart + 7 * DAY;
		gamesThisWeek = matches.filter((m) => {
			const t = matchTime(m);
			return t >= weekStart && t < weekEnd;
		}).length;
	}

	// Next upcoming fixture, for the sub-line.
	const next = matches
		.filter((m) => String(m.status).toUpperCase() === "UPCOMING")
		.sort((a, b) => matchTime(a) - matchTime(b))[0];
	const nextLabel = next?.date
		? new Date(next.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
		: "No upcoming fixtures";

	return { name, week, weeks, gamesThisWeek, played, total, pct, nextLabel };
}

export function useDashboardData() {
	const { can, canAny, user, roles, loading: permsLoading } = usePermissions();

	const [loading, setLoading] = useState(true);
	const [kpis, setKpis] = useState<Kpi[]>([]);
	const [season, setSeason] = useState<SeasonPulse>({ name: "", week: 1, weeks: 1, gamesThisWeek: 0, played: 0, total: 0, pct: 0, nextLabel: "" });
	const [fixtures, setFixtures] = useState<Fixture[]>([]);
	const [approvals, setApprovals] = useState<Approval[]>([]);
	const [pipeline, setPipeline] = useState({ published: 0, draft: 0, scheduled: 0, recent: [] as { title: string; status: string }[] });
	const [storage, setStorage] = useState<Storage>({ usedGb: 0, items: 0, pct: 0 });
	const [activity, setActivity] = useState<ActivityEvent[]>([]);
	const [leaders, setLeaders] = useState<Leader[]>([]);
	const [processing, setProcessing] = useState<Set<string>>(new Set());

	const loadApprovals = useCallback(async () => {
		if (!can("notifications:read")) return setApprovals([]);
		const list = await listOf("/api/notifications?unread=true&limit=10", true);
		const mapped: Approval[] = [];
		for (const n of list) {
			if (n.type === "PLAYER_REGISTERED" && n.player) {
				mapped.push({ id: n.id, tab: "Players", title: `${n.player.firstName} ${n.player.lastName}`.trim(), meta: n.message || "New player", entityId: n.player.id });
			} else if (n.type === "TEAM_REGISTERED" && n.team) {
				mapped.push({ id: n.id, tab: "Teams", title: n.team.name, meta: n.message || "New team", entityId: n.team.id });
			} else if (n.type === "CONTACT_MESSAGE") {
				mapped.push({ id: n.id, tab: "Messages", title: n.message || "New message", meta: "Contact message" });
			}
		}
		setApprovals(mapped);
	}, [can]);

	useEffect(() => {
		if (permsLoading) return;
		let cancelled = false;

		(async () => {
			setLoading(true);
			const [teams, players, matchesCount, media, articles, sponsors] = await Promise.all([
				countOf("/api/teams", can("teams:read")),
				countOf("/api/players", can("players:read")),
				countOf("/api/matches", can("matches:read")),
				countOf("/api/media", can("media:read")),
				countOf("/api/news?admin=true", can("news_articles:read")),
				countOf("/api/highlights/sponsors", can("sponsors:read")),
			]);
			if (cancelled) return;

			setKpis(
				[
					{ key: "teams", label: "Teams", value: teams, href: "/admin/teams", tint: "#e4002b", allow: can("teams:read") },
					{ key: "players", label: "Players", value: players, href: "/admin/players", tint: "#1f8a5b", allow: can("players:read") },
					{ key: "matches", label: "Matches", value: matchesCount, href: "/admin/matches", tint: "#2a6fdb", allow: can("matches:read") },
					{ key: "media", label: "Media", value: media, href: "/admin/media", tint: "#d98324", allow: can("media:read") },
					{ key: "articles", label: "Articles", value: articles, href: "/admin/news", tint: "#7c5cff", allow: can("news_articles:read") },
					{ key: "sponsors", label: "Sponsors", value: sponsors, href: "/admin/highlights/sponsors", tint: "#c026a6", allow: can("sponsors:read") },
				]
					.filter((k) => k.allow)
					.map(({ allow, ...k }) => k),
			);

			// Season pulse + fixtures from matches + seasons.
			const [matchList, seasonList] = await Promise.all([listOf("/api/matches", can("matches:read")), listOf("/api/seasons", can("seasons:read") || can("matches:read"))]);
			if (cancelled) return;
			setSeason(deriveSeason(seasonList, matchList));
			setFixtures(
				matchList
					.filter((m) => String(m.status).toUpperCase() !== "COMPLETED")
					.sort((a, b) => matchTime(a) - matchTime(b))
					.slice(0, 6)
					.map((m) => ({ id: String(m.id), home: teamName(m, 1), away: teamName(m, 2), date: m.date ?? null, status: String(m.status || "UPCOMING") })),
			);

			// Media storage from real file sizes.
			const mediaList = await listOf("/api/media", can("media:read"));
			if (cancelled) return;
			const bytes = mediaList.reduce((sum, m) => sum + (Number(m.size) || 0), 0);
			const usedGb = bytes / 1_000_000_000;
			const cap = Math.max(1, Math.ceil(usedGb)); // fill within the current GB (no fabricated quota)
			setStorage({ usedGb: Math.round(usedGb * 100) / 100, items: mediaList.length || media, pct: Math.min(100, Math.round((usedGb / cap) * 100)) });

			// Content pipeline from news.
			const news = await listOf("/api/news?admin=true", can("news_articles:read"));
			if (cancelled) return;
			const statusOf = (a: any) => String(a.status || (a.published ? "PUBLISHED" : "DRAFT")).toUpperCase();
			setPipeline({
				published: news.filter((a) => statusOf(a) === "PUBLISHED").length,
				draft: news.filter((a) => statusOf(a) === "DRAFT").length,
				scheduled: news.filter((a) => statusOf(a) === "SCHEDULED").length,
				recent: news.slice(0, 4).map((a) => ({ title: a.title || "Untitled", status: statusOf(a) })),
			});

			// Recent activity from audit logs.
			const logs = await listOf("/api/audit-logs?limit=6", canAny(["audit_logs:read", "audit_logs:manage"]));
			if (cancelled) return;
			setActivity(
				logs.slice(0, 6).map((l) => ({
					id: String(l.id),
					text: `${String(l.action || "Activity").replace(/_/g, " ").toLowerCase()}${l.user?.name ? ` · ${l.user.name}` : ""}`,
					at: l.createdAt,
				})),
			);

			// League leaders (PPG) — real per-game stats from completed matches.
			if (can("players:read") || can("matches:read")) {
				try {
					const res = await fetch("/api/stats/leaders?stat=Points&limit=5");
					const d = res.ok ? await res.json() : { leaders: [] };
					if (!cancelled) setLeaders(Array.isArray(d?.leaders) ? d.leaders : []);
				} catch {
					if (!cancelled) setLeaders([]);
				}
			}

			await loadApprovals();
			if (!cancelled) setLoading(false);
		})();

		return () => {
			cancelled = true;
		};
	}, [permsLoading, can, canAny, loadApprovals]);

	const resolve = useCallback(
		async (approval: Approval, accept: boolean) => {
			if (approval.tab === "Messages" || !approval.entityId) return;
			const base = approval.tab === "Players" ? `/api/players/${approval.entityId}/approve` : `/api/teams/${approval.entityId}/approve`;
			setProcessing((p) => new Set(p).add(approval.id));
			try {
				await fetch(base, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ approved: accept }) });
				await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: approval.id, read: true }) });
				await loadApprovals();
			} catch {
				/* ignore */
			} finally {
				setProcessing((p) => {
					const n = new Set(p);
					n.delete(approval.id);
					return n;
				});
			}
		},
		[loadApprovals],
	);

	return { loading: loading || permsLoading, user, roles, kpis, season, fixtures, approvals, pipeline, storage, activity, leaders, processing, resolve, can };
}
