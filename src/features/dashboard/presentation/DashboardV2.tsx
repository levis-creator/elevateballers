import { useMemo, useState } from "react";
import { PermissionProvider } from "@/features/rbac/usePermissions";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Shield, Users, Calendar, Images, Newspaper, Handshake, Inbox, CalendarDays, Check, Trophy, Activity as ActivityIcon, Plus, HardDrive } from "lucide-react";
import { useDashboardData, type Approval, type Fixture } from "./hooks/useDashboardData";

const KPI_ICONS: Record<string, typeof Shield> = {
	teams: Shield,
	players: Users,
	matches: Calendar,
	media: Images,
	articles: Newspaper,
	sponsors: Handshake,
};

const QUICK_CREATE = [
	{ label: "New Article", href: "/admin/news/new", icon: Newspaper, permission: "news_articles:create", tint: "#7c5cff" },
	{ label: "Schedule Match", href: "/admin/matches/new", icon: Calendar, permission: "matches:create", tint: "#2a6fdb" },
	{ label: "Add Player", href: "/admin/players/new", icon: Users, permission: "players:create", tint: "#1f8a5b" },
	{ label: "Register Team", href: "/admin/teams/new", icon: Shield, permission: "teams:create", tint: "#e4002b" },
	{ label: "Upload Media", href: "/admin/media", icon: Images, permission: "media:create", tint: "#d98324" },
];

function greeting(): string {
	const h = new Date().getHours();
	return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}
function today(): string {
	return new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}
function fixtureDate(iso: string | null): string {
	if (!iso) return "TBD";
	try {
		return new Date(iso).toLocaleDateString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" });
	} catch {
		return "TBD";
	}
}
function statusMeta(status: string): { label: string; color: string } {
	const s = status.toUpperCase();
	if (s === "LIVE") return { label: "Live", color: "#e4002b" };
	if (s === "COMPLETED") return { label: "Final", color: "#1f9d55" };
	return { label: "Scheduled", color: "#2a6fdb" };
}
function timeAgo(iso: string): string {
	const diff = Date.now() - new Date(iso).getTime();
	if (!Number.isFinite(diff)) return "";
	const m = Math.floor(diff / 60000);
	if (m < 1) return "just now";
	if (m < 60) return `${m}m ago`;
	const h = Math.floor(m / 60);
	if (h < 24) return `${h}h ago`;
	return `${Math.floor(h / 24)}d ago`;
}

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
	<div className={`rounded-2xl border border-[var(--bord)] bg-[var(--surf)] ${className}`}>{children}</div>
);

function DashboardContent() {
	const d = useDashboardData();
	const [tab, setTab] = useState<Approval["tab"]>("Players");

	const tabs: Approval["tab"][] = ["Players", "Teams", "Messages"];
	const countByTab = useMemo(() => {
		const c: Record<string, number> = { Players: 0, Teams: 0, Messages: 0 };
		d.approvals.forEach((a) => (c[a.tab] = (c[a.tab] || 0) + 1));
		return c;
	}, [d.approvals]);
	const visible = d.approvals.filter((a) => a.tab === tab);

	if (d.loading) {
		return (
			<div className="animate-pulse">
				<div className="mb-4 h-28 rounded-2xl bg-[var(--surf)]" />
				<div className="mb-6 grid grid-cols-6 gap-2.5 max-[900px]:grid-cols-3 max-[600px]:grid-cols-2">
					{Array.from({ length: 6 }).map((_, i) => (
						<div key={i} className="h-16 rounded-xl bg-[var(--surf)]" />
					))}
				</div>
				<div className="grid grid-cols-[1.55fr_1fr] gap-5 max-[1100px]:grid-cols-1">
					<div className="h-72 rounded-2xl bg-[var(--surf)]" />
					<div className="h-72 rounded-2xl bg-[var(--surf)]" />
				</div>
			</div>
		);
	}

	return (
		<div className="font-['Archivo'] text-[var(--tx)]">
			{/* header */}
			<div className="mb-5 flex flex-wrap items-end justify-between gap-3">
				<div>
					<div className="mb-1 font-['Space_Mono'] text-[11px] uppercase tracking-[0.16em] text-[var(--brandsoft)]">
						{greeting()}, {d.user?.name?.split(" ")[0] || "Admin"}
					</div>
					<h1 className="font-['Anton'] text-[30px] uppercase leading-none text-[var(--tx)]">League Operations</h1>
				</div>
				<div className="font-['Space_Mono'] text-[12px] text-[var(--txm)]">{today()}</div>
			</div>

			{/* season pulse */}
			<Card className="relative mb-4 overflow-hidden p-6 max-[600px]:p-5">
				<div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(80% 130% at 92% -10%,rgba(228,0,43,0.20),transparent 55%)" }} />
				<div className="relative grid grid-cols-[1.3fr_1fr] gap-8 max-[900px]:grid-cols-1 max-[900px]:gap-6">
					<div>
						<div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--bord)] bg-[var(--surf2)] py-1 pl-2.5 pr-3 font-['Space_Mono'] text-[10px] uppercase tracking-[0.14em] text-[var(--txd)]">
							<span className="relative flex h-[6px] w-[6px]"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--brand)] opacity-75" /><span className="relative inline-flex h-[6px] w-[6px] rounded-full bg-[var(--brand)]" /></span>
							{d.season.name || "Season"} · Regular Season · Live
						</div>
						<h2 className="mb-1 font-['Anton'] text-[46px] uppercase leading-[0.85] text-[var(--tx)] max-[600px]:text-[36px]">Matchday {d.season.week}</h2>
						<p className="mb-5 font-['Archivo'] text-[14px] text-[var(--txd)]">{d.season.nextLabel} · {d.season.gamesThisWeek} games scheduled this week</p>
						<div className="max-w-[440px]">
							<div className="mb-1.5 flex items-baseline justify-between font-['Space_Mono'] text-[11px] uppercase tracking-[0.1em] text-[var(--txm)]"><span>Season progress</span><span className="text-[var(--tx)]">{d.season.played} / {d.season.total} matches</span></div>
							<div className="h-2 overflow-hidden rounded-full bg-[var(--track)]"><div className="h-full rounded-full bg-gradient-to-r from-[var(--brand)] to-[var(--brandlt)]" style={{ width: `${d.season.pct}%` }} /></div>
							<div className="mt-1.5 font-['Space_Mono'] text-[10px] tracking-[0.06em] text-[var(--faint)]">Week {d.season.week} of {d.season.weeks} · {d.season.pct}% complete</div>
						</div>
					</div>
					<div className="rounded-xl border border-[var(--bord)] bg-[var(--surf3)] p-4">
						<div className="mb-3 flex items-center justify-between"><span className="font-['Space_Mono'] text-[10px] uppercase tracking-[0.14em] text-[var(--brandsoft)]">Next Up</span><a href="/admin/matches" className="font-['Space_Mono'] text-[11px] text-[var(--brandsoft)] no-underline">All fixtures →</a></div>
						<div className="flex flex-col gap-2">
							{d.fixtures.slice(0, 3).map((m) => (
								<div key={m.id} className="flex items-center gap-2.5 rounded-lg bg-[var(--surf2)] px-3 py-2">
									<span className="w-[70px] flex-shrink-0 font-['Space_Mono'] text-[10px] uppercase tracking-[0.06em] text-[var(--txm)]">{fixtureDate(m.date)}</span>
									<span className="flex-1 truncate font-['Archivo'] text-[12.5px] font-bold text-[var(--tx)]">{m.home}</span>
									<span className="font-['Anton'] text-[12px] text-[var(--faint)]">v</span>
									<span className="flex-1 truncate text-right font-['Archivo'] text-[12.5px] font-bold text-[var(--tx)]">{m.away}</span>
								</div>
							))}
							{d.fixtures.length === 0 && <div className="py-4 text-center font-['Archivo'] text-[12.5px] text-[var(--txm)]">No upcoming fixtures.</div>}
						</div>
					</div>
				</div>
			</Card>

			{/* KPI strip */}
			{d.kpis.length > 0 && (
				<div className="mb-6 grid grid-cols-6 gap-2.5 max-[900px]:grid-cols-3 max-[600px]:grid-cols-2">
					{d.kpis.map((k) => {
						const Icon = KPI_ICONS[k.key] || Shield;
						return (
							<a key={k.key} href={k.href} className="group flex items-center gap-3 rounded-xl border border-[var(--bord)] bg-[var(--surf)] px-3.5 py-3 text-left no-underline hover:border-[var(--brand)]/40">
								<span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: `${k.tint}22`, color: k.tint }}><Icon className="h-[17px] w-[17px]" /></span>
								<span className="min-w-0"><span className="block font-['Anton'] text-[22px] leading-none text-[var(--tx)]">{k.value}</span><span className="block font-['Space_Mono'] text-[9.5px] uppercase tracking-[0.08em] text-[var(--txm)]">{k.label}</span></span>
							</a>
						);
					})}
				</div>
			)}

			{/* main + rail */}
			<div className="grid grid-cols-[1.55fr_1fr] gap-5 max-[1100px]:grid-cols-1">
				<div className="flex flex-col gap-5">
					{/* Approvals */}
					<Card className="overflow-hidden">
						<div className="flex items-center justify-between border-b border-[var(--bord2)] px-5 py-4">
							<div className="flex items-center gap-2.5"><span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--brand)]/[0.12] text-[var(--brand)]"><Inbox className="h-[15px] w-[15px]" /></span><h2 className="font-['Anton'] text-[19px] uppercase tracking-[0.01em] text-[var(--tx)]">Approvals</h2><span className="rounded-full bg-[var(--brand)] px-2 py-0.5 font-['Space_Mono'] text-[10px] font-bold text-white">{d.approvals.length}</span></div>
						</div>
						<div className="flex gap-2 border-b border-[var(--bord2)] px-5 py-3">
							{tabs.map((t) => {
								const on = tab === t;
								return (
									<button key={t} type="button" onClick={() => setTab(t)} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-['Archivo'] text-[12px] font-bold uppercase tracking-[0.03em] ${on ? "border-[var(--brand)] bg-[var(--brand)]/[0.12] text-[var(--brandsoft)]" : "border-[var(--bord)] text-[var(--txm)]"}`}>
										{t}<span className={`inline-flex min-w-[18px] justify-center rounded-full px-1 font-['Space_Mono'] text-[10px] ${on ? "bg-[var(--brand)] text-white" : "bg-[var(--chip)] text-[var(--txm)]"}`}>{countByTab[t] || 0}</span>
									</button>
								);
							})}
						</div>
						<div className="flex flex-col">
							{visible.map((a) => {
								const busy = d.processing.has(a.id);
								const canApprove = a.tab === "Players" ? d.can("players:approve") : a.tab === "Teams" ? d.can("teams:approve") : false;
								return (
									<div key={a.id} className="flex items-center gap-3.5 border-b border-[var(--bord2)] px-5 py-3.5 max-[560px]:flex-col max-[560px]:items-start">
										<div className="min-w-0 flex-1"><div className="font-['Archivo'] text-[13.5px] font-bold leading-snug text-[var(--tx)]">{a.title}</div><div className="mt-0.5 font-['Space_Mono'] text-[11px] text-[var(--txm)]">{a.meta}</div></div>
										{a.tab === "Messages" ? (
											<a href="/admin/messages" className="rounded-md border border-[var(--bord)] px-3 py-2 font-['Archivo'] text-[11px] font-extrabold uppercase tracking-[0.04em] text-[var(--txm)] no-underline hover:border-[var(--brand)]/50 hover:text-[var(--brand)]">Open</a>
										) : canApprove ? (
											<div className="flex flex-shrink-0 items-center gap-2">
												<button type="button" disabled={busy} onClick={() => d.resolve(a, true)} className="rounded-md bg-[var(--brand)] px-3 py-2 font-['Archivo'] text-[11px] font-extrabold uppercase tracking-[0.04em] text-white hover:bg-[var(--brandlt)] disabled:opacity-50">{busy ? "…" : "Approve"}</button>
												<button type="button" disabled={busy} onClick={() => d.resolve(a, false)} className="rounded-md border border-[var(--bord)] px-3 py-2 font-['Archivo'] text-[11px] font-extrabold uppercase tracking-[0.04em] text-[var(--txm)] hover:border-[var(--brand)]/50 hover:text-[var(--brand)] disabled:opacity-50">Reject</button>
											</div>
										) : (
											<a href={a.tab === "Players" ? "/admin/players" : "/admin/teams"} className="rounded-md border border-[var(--bord)] px-3 py-2 font-['Archivo'] text-[11px] font-extrabold uppercase tracking-[0.04em] text-[var(--txm)] no-underline hover:border-[var(--brand)]/50">Review</a>
										)}
									</div>
								);
							})}
							{visible.length === 0 && (
								<div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
									<span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--surf2)] text-[#1f9d55]"><Check className="h-5 w-5" /></span>
									<div className="font-['Anton'] text-[18px] uppercase text-[var(--tx)]">Queue clear</div>
									<p className="max-w-[300px] font-['Archivo'] text-[13px] text-[var(--txm)]">No pending {tab.toLowerCase()} to review. Nice work.</p>
								</div>
							)}
						</div>
					</Card>

					{/* This Week — stretches to fill the column height (equal with Approvals) */}
					<Card className="flex flex-1 flex-col overflow-hidden">
						<div className="flex items-center justify-between border-b border-[var(--bord2)] px-5 py-4">
							<div className="flex items-center gap-2.5"><span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--brand)]/[0.12] text-[var(--brand)]"><CalendarDays className="h-[15px] w-[15px]" /></span><h2 className="font-['Anton'] text-[19px] uppercase tracking-[0.01em] text-[var(--tx)]">This Week</h2></div>
							<a href="/admin/matches" className="font-['Space_Mono'] text-[11px] text-[var(--brandsoft)] no-underline">Full schedule →</a>
						</div>
						<div className="flex flex-1 flex-col">
							{d.fixtures.map((f: Fixture) => {
								const st = statusMeta(f.status);
								return (
									<div key={f.id} className="flex flex-1 items-center gap-3.5 border-b border-[var(--bord2)] px-5 py-3 last:border-b-0">
										<span className="w-[104px] flex-shrink-0 font-['Space_Mono'] text-[11px] uppercase tracking-[0.06em] text-[var(--txm)]">{fixtureDate(f.date)}</span>
										<span className="flex-1 truncate font-['Archivo'] text-[13px] font-bold text-[var(--tx)]">{f.home}</span>
										<span className="font-['Anton'] text-[12px] text-[var(--faint)]">v</span>
										<span className="flex-1 truncate font-['Archivo'] text-[13px] font-bold text-[var(--tx)]">{f.away}</span>
										<span className="flex-shrink-0 rounded px-2.5 py-1 font-['Space_Mono'] text-[11px] font-bold" style={{ background: `${st.color}22`, color: st.color }}>{st.label}</span>
									</div>
								);
							})}
							{d.fixtures.length === 0 && <div className="px-5 py-8 text-center font-['Archivo'] text-[13px] text-[var(--txm)]">No upcoming fixtures scheduled.</div>}
						</div>
					</Card>
				</div>

				{/* rail */}
				<div className="flex flex-col gap-5">
					<Card className="p-5">
						<h2 className="mb-4 font-['Anton'] text-[17px] uppercase tracking-[0.02em] text-[var(--tx)]">Quick Create</h2>
						<div className="flex flex-col gap-2">
							{QUICK_CREATE.filter((q) => d.can(q.permission)).map((q) => {
								const Icon = q.icon;
								return (
									<a key={q.href} href={q.href} className="group flex items-center gap-3 rounded-xl border border-[var(--bord)] bg-[var(--surf2)] px-3.5 py-2.5 text-left no-underline hover:border-[var(--brand)]/50 hover:bg-[var(--hov)]">
										<span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: `${q.tint}22`, color: q.tint }}><Icon className="h-[17px] w-[17px]" /></span>
										<span className="flex-1 font-['Archivo'] text-[13px] font-bold text-[var(--tx)]">{q.label}</span>
										<Plus className="h-[14px] w-[14px] text-[var(--faint)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--brand)]" />
									</a>
								);
							})}
						</div>
					</Card>

					<Card className="p-5">
						<div className="mb-4 flex items-center justify-between"><h2 className="font-['Anton'] text-[17px] uppercase tracking-[0.02em] text-[var(--tx)]">Content Pipeline</h2><a href="/admin/news" className="font-['Space_Mono'] text-[11px] text-[var(--brandsoft)] no-underline">Manage →</a></div>
						<div className="mb-4 grid grid-cols-3 gap-2">
							{[{ label: "Published", value: d.pipeline.published, color: "#1f9d55" }, { label: "Draft", value: d.pipeline.draft, color: "#d98324" }, { label: "Scheduled", value: d.pipeline.scheduled, color: "#2a6fdb" }].map((p) => (
								<div key={p.label} className="rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-2 py-2.5 text-center"><div className="font-['Anton'] text-[22px] leading-none" style={{ color: p.color }}>{p.value}</div><div className="mt-1 font-['Space_Mono'] text-[9px] uppercase tracking-[0.08em] text-[var(--txm)]">{p.label}</div></div>
							))}
						</div>
						<div className="flex flex-col gap-2">
							{d.pipeline.recent.map((a, i) => (
								<div key={i} className="flex items-center gap-2.5 rounded-lg px-1 py-1.5"><span className="min-w-0 flex-1 truncate font-['Archivo'] text-[12.5px] text-[var(--tx)]">{a.title}</span><span className="flex-shrink-0 rounded px-2 py-0.5 font-['Space_Mono'] text-[9px] font-bold uppercase tracking-[0.06em]" style={{ background: "var(--chip)", color: "var(--txm)" }}>{a.status}</span></div>
							))}
							{d.pipeline.recent.length === 0 && <div className="py-2 font-['Archivo'] text-[12.5px] text-[var(--txm)]">No articles yet.</div>}
						</div>
					</Card>

					{/* Media storage — item count + used size are real (summed from file sizes). */}
					<Card className="p-5">
						<div className="mb-3 flex items-center justify-between"><h2 className="font-['Anton'] text-[17px] uppercase tracking-[0.02em] text-[var(--tx)]">Media Storage</h2><span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--surf2)] text-[var(--txm)]"><HardDrive className="h-[15px] w-[15px]" /></span></div>
						<div className="mb-2 h-2.5 overflow-hidden rounded-full bg-[var(--track)]"><div className="h-full rounded-full bg-gradient-to-r from-[#d98324] to-[#e4a04a]" style={{ width: `${d.storage.pct}%` }} /></div>
						<div className="flex items-center justify-between font-['Space_Mono'] text-[11px] text-[var(--txm)]"><span>{d.storage.items} items</span><span className="text-[var(--tx)]">{d.storage.usedGb} GB used</span></div>
					</Card>
				</div>
			</div>

			{/* activity + leaders */}
			<div className="mt-5 grid grid-cols-[1.4fr_1fr] gap-5 max-[1100px]:grid-cols-1">
				<Card className="p-5">
					<div className="mb-4 flex items-center justify-between"><h2 className="font-['Anton'] text-[17px] uppercase tracking-[0.02em] text-[var(--tx)]">Recent Activity</h2><a href="/admin/audit-logs" className="font-['Space_Mono'] text-[11px] text-[var(--brandsoft)] no-underline">Audit log →</a></div>
					<div className="flex flex-col">
						{d.activity.map((ev) => (
							<div key={ev.id} className="flex items-start gap-3 border-b border-[var(--bord2)] py-2.5 last:border-b-0">
								<span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--surf2)] text-[var(--txm)]"><ActivityIcon className="h-[15px] w-[15px]" /></span>
								<div className="min-w-0 flex-1"><div className="font-['Archivo'] text-[12.5px] capitalize leading-snug text-[var(--txd)]">{ev.text}</div><div className="mt-0.5 font-['Space_Mono'] text-[10px] text-[var(--faint)]">{timeAgo(ev.at)}</div></div>
							</div>
						))}
						{d.activity.length === 0 && <div className="py-6 text-center font-['Archivo'] text-[13px] text-[var(--txm)]">No recent activity.</div>}
					</div>
				</Card>
				{/* League leaders — no stats endpoint yet; clean placeholder. */}
				<Card className="flex flex-col p-5">
					<div className="mb-4 flex items-center justify-between"><h2 className="font-['Anton'] text-[17px] uppercase tracking-[0.02em] text-[var(--tx)]">League Leaders</h2><span className="font-['Space_Mono'] text-[10px] uppercase tracking-[0.1em] text-[var(--txm)]">PPG</span></div>
					<div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
						<span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--surf2)] text-[var(--brandsoft)]"><Trophy className="h-5 w-5" /></span>
						<p className="max-w-[240px] font-['Archivo'] text-[12.5px] text-[var(--txm)]">Player scoring leaders will appear here once match stats are recorded.</p>
					</div>
				</Card>
			</div>

			<div className="py-6 text-center font-['Space_Mono'] text-[11px] tracking-[0.04em] text-[var(--faint)]">Elevate Ballers CMS · v2 · Nairobi, Kenya</div>
		</div>
	);
}

/** Establishes its own PermissionProvider (matches the v1 Dashboard). */
export default function DashboardV2() {
	return (
		<ErrorBoundary>
			<PermissionProvider>
				<DashboardContent />
			</PermissionProvider>
		</ErrorBoundary>
	);
}
