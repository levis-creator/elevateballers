import { useEffect, useState } from "react";
import { useMatchViewStore } from "@/features/matches/presentation/stores/v2/useMatchViewStore";
import TeamName from "@/features/teams/presentation/components/TeamName";
import type { MatchView } from "@/features/matches/domain/entities/match-detail-v2";

const STRIPE = "repeating-linear-gradient(45deg,#e7e2da,#e7e2da 4px,#f0ece5 4px,#f0ece5 8px)";

/** Segmented tab (box team / play-by-play period). */
const seg = (active: boolean) =>
	`cursor-pointer rounded-md px-4 py-2 font-body text-[12px] uppercase tracking-[0.05em] ${
		active ? "border-none bg-brand font-bold text-white" : "border border-black/15 bg-white font-semibold text-muted hover:border-brand"
	}`;

/** Round player/team avatar — image when present, else a neutral stripe. */
function Avatar({ image, size }: { image: string | null; size: number }) {
	const cls = "flex-shrink-0 rounded-full object-cover";
	if (image) return <img src={image} alt="" loading="lazy" className={cls} style={{ width: size, height: size }} />;
	return <div className={cls} style={{ width: size, height: size, background: STRIPE }} />;
}

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
	<h2 className="mb-4 font-display text-[22px] uppercase text-ink">{children}</h2>
);

/** Full match-detail view: scoreboard hero + state-driven sections
 *  (live/final: quarters, performers, comparison, box, play-by-play;
 *  upcoming: recent form, head-to-head, players to watch). React island;
 *  box team and play-by-play period live in a Zustand store. */
export default function MatchDetailBoard({ view: initialView }: { view: MatchView }) {
	const [view, setView] = useState(initialView);
	const { box, period, setBox, setPeriod } = useMatchViewStore();

	// Live matches refresh themselves in place. Poll the computed view every 15s
	// while LIVE; the effect re-runs and tears the timer down once the match ends
	// (state flips to "final"). Selected tabs live in the store, so they persist
	// across updates.
	useEffect(() => {
		if (view.state !== "live") return;
		let cancelled = false;
		const timer = setInterval(async () => {
			try {
				const res = await fetch(`/api/matches/${view.id}/view`, { headers: { accept: "application/json" } });
				if (!res.ok) return;
				const next = (await res.json()) as MatchView;
				if (!cancelled && next?.id) setView(next);
			} catch {
				/* transient network error — keep the last good view, retry next tick */
			}
		}, 15000);
		return () => {
			cancelled = true;
			clearInterval(timer);
		};
	}, [view.id, view.state]);

	const activeBox = box === "away" ? "away" : "home";
	const activePeriod = period && view.pbpPeriods.includes(period) ? period : (view.pbpPeriods[view.pbpPeriods.length - 1] ?? "");
	const boxRows = view.box[activeBox];
	const pbpRows = activePeriod ? (view.pbpByPeriod[activePeriod] ?? []) : [];
	const barColor = (textColor: string) => (textColor === "#e4002b" ? "#e4002b" : "rgba(228,0,43,0.35)");

	return (
		<>
			{/* SCOREBOARD HERO */}
			<section className="relative overflow-hidden border-b border-black/[0.08] bg-night text-cream">
				<div className="absolute inset-0" style={{ background: "radial-gradient(100% 130% at 50% -20%,rgba(228,0,43,0.2),transparent 60%)" }} />
				<div className="relative mx-auto max-w-[1000px] px-8 py-9 max-[960px]:px-6">
					<div className="mb-7 flex items-center justify-between gap-3">
						<a href={view.backHref} className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted2 no-underline hover:text-brandsoft">{view.backLabel}</a>
						<span className="font-mono text-[11px] uppercase tracking-[0.1em] text-brandsoft">{view.league} · {view.scoreboardTag}</span>
					</div>
					<div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 max-[600px]:gap-2">
						<a href={view.home.href} className="flex min-w-0 flex-col items-center gap-3 text-center no-underline">
							<TeamName
								team={{ name: view.home.name, nickname: view.home.nickname, logo: view.home.logo, initials: view.home.abbr }}
								variant="full"
								withCrest
								align="center"
								className="flex-col font-display text-[20px] uppercase leading-none max-[600px]:text-[15px]"
								crestClassName="h-[84px] w-[84px] font-display text-[28px] max-[600px]:h-16 max-[600px]:w-16"
								textStyle={{ color: view.home.color }}
							/>
							<div className="mt-1 font-mono text-[11px] text-muted2">{view.home.record ? `${view.home.record} · ` : ""}Home</div>
						</a>
						<div className="flex flex-col items-center gap-1.5">
							{view.hasScore ? (
								<div className="font-display text-[62px] leading-none max-[600px]:text-[38px]">
									<span style={{ color: view.home.color }}>{view.home.score}</span>
									<span className="mx-2 text-[#6b635a]">–</span>
									<span style={{ color: view.away.color }}>{view.away.score}</span>
								</div>
							) : (
								<div className="font-display text-[54px] leading-none text-[#6b635a] max-[600px]:text-[34px]">VS</div>
							)}
							{view.state === "upcoming" && (
								<span className="rounded bg-brand/20 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-brandsoft">Tip-off {view.time}</span>
							)}
							{view.state === "final" && (
								<span className="rounded bg-white/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-creamdim">Full Time</span>
							)}
							{view.state === "live" && (
								<span className="flex items-center gap-2 rounded bg-brand px-3 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-white">
									<span className="inline-block h-2 w-2 animate-pulse rounded-full bg-white" />{view.liveTag}
								</span>
							)}
						</div>
						<a href={view.away.href} className="flex min-w-0 flex-col items-center gap-3 text-center no-underline">
							<TeamName
								team={{ name: view.away.name, nickname: view.away.nickname, logo: view.away.logo, initials: view.away.abbr }}
								variant="full"
								withCrest
								align="center"
								className="flex-col font-display text-[20px] uppercase leading-none max-[600px]:text-[15px]"
								crestClassName="h-[84px] w-[84px] font-display text-[28px] max-[600px]:h-16 max-[600px]:w-16"
								textStyle={{ color: view.away.color }}
							/>
							<div className="mt-1 font-mono text-[11px] text-muted2">{view.away.record ? `${view.away.record} · ` : ""}Away</div>
						</a>
					</div>
					<div className="mt-7 flex flex-wrap items-center justify-center gap-2 border-t border-white/10 pt-4 font-mono text-[11px] text-muted2">
						<span>{view.dateText}</span><span className="text-white/20">·</span><span>{view.time}</span>
						{view.venue && (<><span className="text-white/20">·</span><span>{view.venue}</span></>)}
					</div>
				</div>
			</section>

			{view.showStats ? (
				<>
					{/* QUARTER BREAKDOWN */}
					{view.quarters.length > 0 && (
						<section className="mx-auto max-w-[1000px] px-8 pt-[48px] max-[960px]:px-6 max-[960px]:pt-9">
							<SectionTitle>Scoring by Quarter</SectionTitle>
							<div className="overflow-x-auto rounded-xl border border-black/10 bg-white shadow-[0_1px_2px_rgba(20,16,9,0.04)]">
								<div className="min-w-[520px]">
									<div className="grid items-center gap-2 border-b border-black/[0.08] bg-paper2 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.08em] text-muted2" style={{ gridTemplateColumns: `1fr repeat(${view.periodLabels.length},52px) 72px` }}>
										<span>Team</span>
										{view.periodLabels.map((q) => (<span key={q} className="text-center">{q}</span>))}
										<span className="text-right">Final</span>
									</div>
									{view.quarters.map((row) => (
										<div key={row.name} className="grid items-center gap-2 border-b border-black/[0.06] px-5 py-3.5 last:border-0" style={{ gridTemplateColumns: `1fr repeat(${view.periodLabels.length},52px) 72px` }}>
											<TeamName
												team={{ name: row.name, nickname: row.nickname, initials: row.abbr }}
												variant="table"
												withCrest
												className="font-body text-[14px] font-bold"
												textStyle={{ color: row.color }}
											/>
											{row.scores.map((s, i) => (<span key={i} className="text-center font-mono text-[13px] text-muted">{s}</span>))}
											<span className="text-right font-display text-[20px]" style={{ color: row.color }}>{row.total}</span>
										</div>
									))}
								</div>
							</div>
						</section>
					)}

					{/* TOP PERFORMERS */}
					{view.performers.length > 0 && (
						<section className="mx-auto max-w-[1000px] px-8 pt-[48px] max-[960px]:px-6 max-[960px]:pt-9">
							<SectionTitle>Top Performers</SectionTitle>
							<div className="grid grid-cols-3 gap-4 max-[600px]:grid-cols-1">
								{view.performers.map((p, i) => (
									<div key={i} className="rounded-xl border border-black/10 bg-white p-5 shadow-[0_1px_2px_rgba(20,16,9,0.04)]">
										<div className="mb-4 flex items-center gap-3">
											<Avatar image={p.image} size={44} />
											<div>
												<div className="font-body text-[15px] font-extrabold uppercase leading-tight text-ink2">{p.name}</div>
												<div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-muted2">{p.team}</div>
											</div>
										</div>
										<div className="grid grid-cols-3 gap-2 border-t border-black/[0.06] pt-4 text-center">
											<div><div className="font-display text-[26px] leading-none text-brand">{p.pts}</div><div className="mt-1 font-mono text-[9px] uppercase tracking-[0.06em] text-muted2">Pts</div></div>
											<div><div className="font-display text-[26px] leading-none text-ink">{p.reb}</div><div className="mt-1 font-mono text-[9px] uppercase tracking-[0.06em] text-muted2">Reb</div></div>
											<div><div className="font-display text-[26px] leading-none text-ink">{p.ast}</div><div className="mt-1 font-mono text-[9px] uppercase tracking-[0.06em] text-muted2">Ast</div></div>
										</div>
									</div>
								))}
							</div>
						</section>
					)}

					{/* TEAM COMPARISON */}
					{view.comparison.length > 0 && (
						<section className="mx-auto max-w-[1000px] px-8 pt-[48px] max-[960px]:px-6 max-[960px]:pt-9">
							<SectionTitle>Team Comparison</SectionTitle>
							<div className="rounded-xl border border-black/10 bg-white p-6 shadow-[0_1px_2px_rgba(20,16,9,0.04)]">
								<div className="mb-5 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.08em]">
									<span className="font-bold text-ink2">{view.home.abbr}</span>
									<span className="text-muted2">Team Stats</span>
									<span className="font-bold text-ink2">{view.away.abbr}</span>
								</div>
								<div className="flex flex-col gap-4">
									{view.comparison.map((c) => (
										<div key={c.label}>
											<div className="mb-1.5 flex items-center justify-between font-mono text-[12px]">
												<span className="font-bold" style={{ color: c.homeColor }}>{c.homeVal}</span>
												<span className="uppercase tracking-[0.06em] text-muted2">{c.label}</span>
												<span className="font-bold" style={{ color: c.awayColor }}>{c.awayVal}</span>
											</div>
											<div className="flex items-center gap-1">
												<div className="flex h-2 flex-1 justify-end overflow-hidden rounded-l-full bg-black/[0.06]"><div style={{ height: "100%", borderRadius: "9999px 0 0 9999px", width: `${c.homePct}%`, background: barColor(c.homeColor) }} /></div>
												<div className="flex h-2 flex-1 overflow-hidden rounded-r-full bg-black/[0.06]"><div style={{ height: "100%", borderRadius: "0 9999px 9999px 0", width: `${c.awayPct}%`, background: barColor(c.awayColor) }} /></div>
											</div>
										</div>
									))}
								</div>
							</div>
						</section>
					)}

					{/* BOX SCORES */}
					{(view.box.home.length > 0 || view.box.away.length > 0) && (
						<section className="mx-auto max-w-[1000px] px-8 py-[48px] max-[960px]:px-6 max-[960px]:py-9">
							<div className="mb-4 flex items-center gap-2">
								<button type="button" onClick={() => setBox("home")} className={seg(activeBox === "home")}>{view.home.name}</button>
								<button type="button" onClick={() => setBox("away")} className={seg(activeBox === "away")}>{view.away.name}</button>
							</div>
							<div className="overflow-x-auto rounded-xl border border-black/10 bg-white shadow-[0_1px_2px_rgba(20,16,9,0.04)]">
								<div className="min-w-[640px]">
									<div className="grid grid-cols-[1fr_52px_52px_52px_52px_52px_56px] items-center gap-2 border-b border-black/[0.08] bg-paper2 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.08em] text-muted2">
										<span>Player</span><span className="text-center">MIN</span><span className="text-center">PTS</span><span className="text-center">REB</span><span className="text-center">AST</span><span className="text-center">STL</span><span className="text-center">3PT</span>
									</div>
									{boxRows.length > 0 ? boxRows.map((p, i) => (
										<div key={i} className="grid grid-cols-[1fr_52px_52px_52px_52px_52px_56px] items-center gap-2 border-b border-black/[0.06] px-5 py-3 last:border-0 hover:bg-paper2">
											<span className="flex items-center gap-3">
												<span className="w-6 font-mono text-[11px] text-muted2">{p.num}</span>
												<span className="font-body text-[14px] font-bold text-ink2">{p.name}</span>
												{p.starter && <span className="rounded bg-brand/10 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.08em] text-brand">ST</span>}
											</span>
											<span className="text-center font-mono text-[13px] text-muted">{p.min}</span>
											<span className="text-center font-mono text-[13px] font-bold text-ink2">{p.pts}</span>
											<span className="text-center font-mono text-[13px] text-muted">{p.reb}</span>
											<span className="text-center font-mono text-[13px] text-muted">{p.ast}</span>
											<span className="text-center font-mono text-[13px] text-muted">{p.stl}</span>
											<span className="text-center font-mono text-[13px] text-muted">{p.tp}</span>
										</div>
									)) : (
										<div className="px-5 py-8 text-center font-body text-[13px] text-muted">No box score recorded for this team.</div>
									)}
								</div>
							</div>
						</section>
					)}

					{/* PLAY-BY-PLAY */}
					{view.pbpPeriods.length > 0 && (
						<section className="mx-auto max-w-[1000px] px-8 pb-[48px] max-[960px]:px-6 max-[960px]:pb-9">
							<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
								<h2 className="flex items-center gap-3 font-display text-[22px] uppercase text-ink">
									Play-by-Play
									{view.state === "live" && (
										<span className="flex items-center gap-1.5 rounded bg-brand px-2 py-1 font-mono text-[9px] tracking-[0.1em] text-white"><span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-white" />LIVE</span>
									)}
								</h2>
								<div className="flex items-center gap-2">
									{view.pbpPeriods.map((q) => (
										<button key={q} type="button" onClick={() => setPeriod(q)} className={seg(activePeriod === q)}>{q}</button>
									))}
								</div>
							</div>
							<div className="mb-3 flex items-center gap-5 font-mono text-[11px] text-muted2">
								<span className="flex items-center gap-2"><span className="inline-block h-2.5 w-2.5 rounded-full bg-brand" />{view.home.abbr}</span>
								<span className="flex items-center gap-2"><span className="inline-block h-2.5 w-2.5 rounded-full bg-ink" />{view.away.abbr}</span>
							</div>
							<div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-[0_1px_2px_rgba(20,16,9,0.04)]">
								{pbpRows.map((e, i) => (
									<div key={i} className="flex items-center gap-4 border-b border-black/[0.06] px-5 py-3 last:border-0">
										<span className="w-[46px] flex-shrink-0 font-mono text-[12px] text-muted2">{e.t}</span>
										<span className="inline-block h-[9px] w-[9px] flex-shrink-0 rounded-full" style={{ background: e.side === "home" ? "#e4002b" : e.side === "away" ? "#141009" : "#b3a99c" }} />
										<span className="flex-1 font-body text-[14px] text-ink2">{e.text}</span>
										<span className="flex-shrink-0 font-display text-[17px] text-ink">{e.score}</span>
									</div>
								))}
							</div>
						</section>
					)}

					{!view.quarters.length && !view.performers.length && !view.box.home.length && !view.box.away.length && !view.pbpPeriods.length && (
						<section className="mx-auto max-w-[1000px] px-8 py-[56px] max-[960px]:px-6">
							<div className="flex flex-col items-center gap-3 rounded-[14px] border border-dashed border-black/[0.16] bg-paper2 px-8 py-16 text-center">
								<div className="font-display text-[20px] uppercase text-ink">Stats coming soon</div>
								<p className="max-w-[360px] text-[14px] leading-[1.5] text-muted">Detailed box scores and play-by-play for this match haven’t been recorded yet.</p>
							</div>
						</section>
					)}
				</>
			) : (
				<>
					{/* RECENT FORM */}
					{view.formGuide.length > 0 && (
						<section className="mx-auto max-w-[1000px] px-8 pt-[48px] max-[960px]:px-6 max-[960px]:pt-9">
							<SectionTitle>Recent Form</SectionTitle>
							<div className="grid grid-cols-2 gap-4 max-[600px]:grid-cols-1">
								{view.formGuide.map((f) => (
									<div key={f.team} className="rounded-xl border border-black/10 bg-white p-5 shadow-[0_1px_2px_rgba(20,16,9,0.04)]">
										<TeamName
											team={{ name: f.team, nickname: f.nickname, logo: f.logo, initials: f.abbr }}
											variant="compact"
											withCrest
											className="mb-4 font-body text-[15px] font-extrabold uppercase text-ink2"
										/>
										<div className="flex items-center gap-2">
											<span className="mr-1 font-mono text-[10px] uppercase tracking-[0.08em] text-muted2">Last {f.chips.length}</span>
											{f.chips.map((c, i) => (
												<span key={i} className="flex h-6 w-6 items-center justify-center rounded-md font-mono text-[11px] font-bold" style={c === "W" ? { background: "rgba(31,157,85,0.14)", color: "#1f9d55" } : c === "L" ? { background: "rgba(228,0,43,0.1)", color: "#e4002b" } : { background: "#f0ede7", color: "#8a817a" }}>{c}</span>
											))}
										</div>
									</div>
								))}
							</div>
						</section>
					)}

					{/* HEAD TO HEAD */}
					{view.h2h.length > 0 && (
						<section className="mx-auto max-w-[1000px] px-8 pt-[48px] max-[960px]:px-6 max-[960px]:pt-9">
							<SectionTitle>Head to Head</SectionTitle>
							<div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-[0_1px_2px_rgba(20,16,9,0.04)]">
								{view.h2h.map((g, i) => (
									<div key={i} className="flex items-center gap-3 border-b border-black/[0.06] px-5 py-3.5 last:border-0 max-[600px]:flex-wrap">
										<span className="w-[92px] flex-shrink-0 font-mono text-[11px] text-muted2">{g.dateText}</span>
										<span className="flex-1 font-body text-[14px] font-bold text-ink2">{g.home} <span className="font-normal text-muted2">vs</span> {g.away}</span>
										<span className="font-display text-[18px] text-ink">{g.score}</span>
										{g.winner && <span className="w-[110px] flex-shrink-0 text-right font-mono text-[11px] text-win">{g.winner} win</span>}
									</div>
								))}
							</div>
						</section>
					)}

					{/* PLAYERS TO WATCH */}
					{view.watch.length > 0 && (
						<section className="mx-auto max-w-[1000px] px-8 py-[48px] max-[960px]:px-6 max-[960px]:py-9">
							<SectionTitle>Players to Watch</SectionTitle>
							<div className="grid grid-cols-3 gap-4 max-[600px]:grid-cols-1">
								{view.watch.map((p, i) => (
									<div key={i} className="rounded-xl border border-black/10 bg-white p-5 shadow-[0_1px_2px_rgba(20,16,9,0.04)]">
										<div className="flex items-center gap-3">
											<Avatar image={p.image} size={44} />
											<div>
												<div className="font-body text-[15px] font-extrabold uppercase leading-tight text-ink2">{p.name}</div>
												<div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-muted2">{p.team}</div>
											</div>
										</div>
										<div className="mt-4 border-t border-black/[0.06] pt-3 font-body text-[13px] text-muted">{p.line}</div>
									</div>
								))}
							</div>
						</section>
					)}

					{!view.formGuide.length && !view.h2h.length && !view.watch.length && (
						<section className="mx-auto max-w-[1000px] px-8 py-[56px] max-[960px]:px-6">
							<div className="flex flex-col items-center gap-3 rounded-[14px] border border-dashed border-black/[0.16] bg-paper2 px-8 py-16 text-center">
								<div className="font-display text-[20px] uppercase text-ink">Preview coming soon</div>
								<p className="max-w-[360px] text-[14px] leading-[1.5] text-muted">Form, head-to-head history and players to watch will appear here closer to tip-off.</p>
							</div>
						</section>
					)}
				</>
			)}
		</>
	);
}
