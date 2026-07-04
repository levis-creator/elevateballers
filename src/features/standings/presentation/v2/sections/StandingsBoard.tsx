import { useStandingsStore } from "@/features/standings/presentation/stores/v2/useStandingsStore";
import { pillClass } from "@/features/home/presentation/v2/lib/tab-styles";
import type { StandingRow } from "@/features/standings/domain/entities/standings-v2";

interface Props {
	rows: StandingRow[];
	leagues: string[];
	seasonLabel: string;
	playoffSpots: number;
}

const GRID = "grid-cols-[60px_1fr_44px_44px_44px_44px_60px_60px_64px_56px]";
const diffLabel = (d: number) => `${d > 0 ? "+" : ""}${d}`;
const diffColor = (d: number) => (d > 0 ? "#2f9e44" : d < 0 ? "#e4002b" : "#a49a8d");
const PLACE = ["1st Place", "2nd Place", "3rd Place"];

/** Standings — hero + league filter tabs + top-3 + full table + search.
 *  React island; league filter and search live in a Zustand store. Rankings are
 *  computed within the active league filter. */
export default function StandingsBoard({ rows, leagues, seasonLabel, playoffSpots }: Props) {
	const { league, query, setLeague, setQuery } = useStandingsStore();

	// Default to the first league; guard against a stale selection.
	const activeLeague = league && leagues.includes(league) ? league : (leagues[0] ?? "");
	const inLeague = rows.filter((r) => r.league === activeLeague);
	const ranked = [...inLeague]
		.sort((a, b) => b.pts - a.pts || b.diff - a.diff || b.pf - a.pf)
		.map((r, i) => ({ ...r, rank: i + 1 }));

	const podium = ranked.slice(0, 3);
	const q = query.trim().toLowerCase();
	const table = q ? ranked.filter((r) => r.name.toLowerCase().includes(q)) : ranked;
	const tabs = leagues;

	return (
		<>
			{/* HERO */}
			<section className="relative overflow-hidden border-b border-black/[0.08]">
				<div className="absolute inset-0" style={{ background: "radial-gradient(120% 80% at 82% -10%,rgba(228,0,43,0.12),transparent 58%)" }} />
				<div className="absolute -top-20 right-[-140px] h-[520px] w-[520px] rounded-full border border-brand/[0.14]" />
				<div className="relative mx-auto max-w-[1280px] px-8 pb-[44px] pt-[56px] max-[960px]:px-6">
					<div className="mb-[18px] inline-flex items-center gap-[10px] font-mono text-[12px] uppercase tracking-[0.14em] text-brand">
						<span className="h-px w-[26px] bg-brand" />League Table · {seasonLabel}
					</div>
					<h1 className="font-display text-[clamp(56px,8vw,120px)] uppercase leading-[0.86] tracking-[0.01em] text-ink">Standings</h1>
				</div>
			</section>

			{ranked.length === 0 ? (
				<section className="mx-auto max-w-[1280px] px-8 py-[72px] max-[960px]:px-6">
					<div className="flex flex-col items-center gap-3 rounded-[14px] border border-dashed border-black/[0.16] bg-paper2 px-8 py-20 text-center">
						<div className="font-display text-[24px] uppercase text-ink">No standings yet</div>
						<p className="max-w-[400px] text-[15px] leading-[1.6] text-muted">Once games are played, standings will appear here.</p>
					</div>
				</section>
			) : (
				<>
					{/* LEAGUE FILTER */}
					{leagues.length > 1 && (
						<section className="border-b border-black/[0.08] bg-panel">
							<div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-2 px-8 py-5 max-[960px]:px-6">
								<span className="mr-2 font-mono text-[11px] uppercase tracking-[0.1em] text-muted2">League</span>
								{tabs.map((t) => (
									<button key={t} type="button" onClick={() => setLeague(t)} className={pillClass(activeLeague === t)}>
										{t}
									</button>
								))}
							</div>
						</section>
					)}

					{/* PODIUM */}
					<section className="mx-auto max-w-[1280px] px-8 pt-[48px] max-[960px]:px-6 max-[960px]:pt-9">
						<div className="grid grid-cols-3 gap-5 max-[960px]:grid-cols-1">
							{podium.map((p, i) => {
								const first = i === 0;
								return (
									<div
										key={p.teamId}
										className="relative overflow-hidden rounded-2xl border p-6"
										style={first ? { background: "#0c0b0a", borderColor: "rgba(255,255,255,0.12)" } : { background: "#fff", borderColor: "rgba(0,0,0,0.1)" }}
									>
										<div className="mb-5 flex items-center justify-between">
											<span className="font-display text-[40px] leading-none" style={{ color: first ? "#e4002b" : "#a49a8d" }}>#{p.rank}</span>
											<span className="rounded px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em]" style={first ? { background: "rgba(228,0,43,0.16)", color: "#ff5a72" } : { background: "#f0ede7", color: "#6f665c" }}>{PLACE[i]}</span>
										</div>
										<div className="mb-5 flex items-center gap-3">
											<div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full font-display text-[16px]" style={first ? { background: "repeating-linear-gradient(45deg,#221d18,#221d18 5px,#1b1712 5px,#1b1712 10px)", color: "#e4002b" } : { background: "repeating-linear-gradient(45deg,#e7e2da,#e7e2da 5px,#f0ece5 5px,#f0ece5 10px)", color: "#6f665c" }}>{p.initials}</div>
											<div>
												<div className="font-body text-[17px] font-extrabold uppercase leading-tight" style={{ color: first ? "#f6f2ec" : "#1a1712" }}>{p.name}</div>
												<div className="mt-0.5 font-mono text-[11px]" style={{ color: "#8a817a" }}>{p.w}-{p.l}{p.d ? `-${p.d}` : ""}</div>
											</div>
										</div>
										<div className="grid grid-cols-3 gap-2 border-t pt-4" style={{ borderColor: first ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)" }}>
											<div>
												<div className="font-display text-[26px] leading-none" style={{ color: "#e4002b" }}>{p.pts}</div>
												<div className="mt-1 font-mono text-[9px] uppercase tracking-[0.08em] text-muted2">Points</div>
											</div>
											<div>
												<div className="font-display text-[26px] leading-none" style={{ color: first ? "#f6f2ec" : "#141009" }}>{p.p}</div>
												<div className="mt-1 font-mono text-[9px] uppercase tracking-[0.08em] text-muted2">Played</div>
											</div>
											<div>
												<div className="font-display text-[26px] leading-none" style={{ color: diffColor(p.diff) }}>{diffLabel(p.diff)}</div>
												<div className="mt-1 font-mono text-[9px] uppercase tracking-[0.08em] text-muted2">Diff</div>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</section>

					{/* FULL TABLE */}
					<section className="mx-auto max-w-[1280px] px-8 py-[48px] max-[960px]:px-6 max-[960px]:py-9">
						<div className="mb-5 flex flex-wrap items-center justify-between gap-4">
							<h2 className="font-display text-[26px] uppercase text-ink">Full Table</h2>
							<div className="flex items-center gap-2.5 rounded-lg border border-black/15 bg-white px-4 py-2.5">
								<span className="font-mono text-[13px] text-muted2">⌕</span>
								<input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search teams…" className="w-[180px] border-none bg-transparent font-body text-[14px] text-ink2 outline-none max-[600px]:w-[120px]" />
							</div>
						</div>

						{table.length > 0 ? (
							<>
								<div className="overflow-x-auto rounded-xl border border-black/10 bg-white shadow-[0_1px_2px_rgba(20,16,9,0.04)]">
									<div className="min-w-[820px]">
										<div className={`grid ${GRID} items-center gap-2 border-b border-black/[0.08] bg-paper2 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.08em] text-muted2`}>
											<span>Rank</span><span>Team</span>
											<span className="text-center">P</span><span className="text-center">W</span><span className="text-center">D</span><span className="text-center">L</span>
											<span className="text-center">PF</span><span className="text-center">PA</span><span className="text-center">Diff</span><span className="text-right">Pts</span>
										</div>
										{table.map((t) => (
											<div key={t.teamId}>
												<a href={t.href} className={`grid ${GRID} items-center gap-2 border-b border-black/[0.06] px-5 py-3 no-underline hover:bg-paper2`} style={t.rank <= playoffSpots ? { background: "rgba(228,0,43,0.04)" } : undefined}>
													<span className="font-display text-[16px]" style={{ color: t.rank <= 3 ? "#e4002b" : "#1a1712" }}>{t.rank}</span>
													<span className="flex items-center gap-3">
														<span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-mono text-[10px] text-muted2" style={{ background: "repeating-linear-gradient(45deg,#e7e2da,#e7e2da 4px,#f0ece5 4px,#f0ece5 8px)" }}>{t.initials}</span>
														<span className="truncate font-body text-[14px] font-bold text-ink2">{t.name}</span>
													</span>
													<span className="text-center font-mono text-[13px] text-muted">{t.p}</span>
													<span className="text-center font-mono text-[13px] text-ink2">{t.w}</span>
													<span className="text-center font-mono text-[13px] text-muted">{t.d}</span>
													<span className="text-center font-mono text-[13px] text-muted">{t.l}</span>
													<span className="text-center font-mono text-[13px] text-muted">{t.pf}</span>
													<span className="text-center font-mono text-[13px] text-muted">{t.pa}</span>
													<span className="text-center font-mono text-[13px] font-bold" style={{ color: diffColor(t.diff) }}>{diffLabel(t.diff)}</span>
													<span className="text-right font-display text-[20px] text-ink">{t.pts}</span>
												</a>
												{!q && t.rank === playoffSpots && ranked.length > playoffSpots && (
													<div className="flex items-center gap-3 bg-brand/[0.04] px-5 py-1.5">
														<span className="h-px flex-1 bg-brand/25" />
														<span className="font-mono text-[9px] uppercase tracking-[0.12em] text-brand">Playoff cutoff · Top {playoffSpots}</span>
														<span className="h-px flex-1 bg-brand/25" />
													</div>
												)}
											</div>
										))}
									</div>
								</div>
								<div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] text-muted2">
									<span className="flex items-center gap-2"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-brand/20" />Playoff position</span>
									<span>P Played · W Won · D Drawn · L Lost · PF Points For · PA Points Against · Diff Differential · Pts Table Points</span>
								</div>
							</>
						) : (
							<div className="flex flex-col items-center gap-3 rounded-[14px] border border-dashed border-black/[0.16] bg-paper2 px-8 py-16 text-center">
								<div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-panel font-mono text-[18px] text-muted2">⌕</div>
								<div className="font-display text-[22px] uppercase text-ink">No teams found</div>
								<p className="max-w-[360px] text-[14px] leading-[1.5] text-muted">Nothing matches "{query}". Try a different team name.</p>
							</div>
						)}
					</section>
				</>
			)}
		</>
	);
}
