import { useResultsStore } from "@/features/fixtures/presentation/stores/v2/useResultsStore";
import { pillClass } from "@/features/home/presentation/v2/lib/tab-styles";
import { Crest } from "./FixtureBoard";
import type { FixtureMatch } from "@/features/fixtures/domain/entities/fixtures-v2";

interface Props {
	/** All matches for the site; the board keeps only completed ("done") games. */
	matches: FixtureMatch[];
	seasons: string[];
	defaultSeason: string;
}

const WON = "#141009";
const LOST = "#a49a8d";
const FEAT_CREST = "repeating-linear-gradient(45deg,#1a1714,#1a1714 6px,#151210 6px,#151210 12px)";

interface Group {
	isoDate: string;
	day: string;
	mon: string;
	weekday: string;
	year: number;
	matches: FixtureMatch[];
}

const winnerText = (m: FixtureMatch): string =>
	m.homeWin ? `${m.home} win` : m.awayWin ? `${m.away} win` : "Draw";

/** Results — hero + featured latest result + league filter + date-grouped final
 *  scores. React island; season and league filters live in a Zustand store.
 *  Reuses the Fixtures data layer (completed matches only). */
export default function ResultsBoard({ matches, seasons, defaultSeason }: Props) {
	const { season, league, setSeason, setLeague } = useResultsStore();

	// Open on the newest season that actually has results, so the page never
	// lands on an empty season when completed games exist elsewhere.
	const seasonsWithResults = seasons.filter((s) => matches.some((m) => m.status === "done" && m.season === s));
	const preferred = seasonsWithResults.includes(defaultSeason) ? defaultSeason : (seasonsWithResults[0] ?? defaultSeason);
	const activeSeason = season && seasons.includes(season) ? season : preferred;
	// Completed games in the season, newest first.
	const seasonDone = matches
		.filter((m) => m.status === "done" && m.season === activeSeason)
		.sort((a, b) => b.ts - a.ts);

	const hasAny = seasonDone.length > 0;
	const feature = seasonDone[0]; // latest overall — independent of the league filter

	const leagues = [...new Set(seasonDone.map((m) => m.league))];
	const activeLeague = league === "all" || leagues.includes(league) ? league : "all";
	const list = activeLeague === "all" ? seasonDone : seasonDone.filter((m) => m.league === activeLeague);

	// Group by match-day, preserving the newest-first order.
	const groups: Group[] = [];
	const byDate = new Map<string, Group>();
	for (const m of list) {
		let g = byDate.get(m.isoDate);
		if (!g) {
			g = { isoDate: m.isoDate, day: m.day, mon: m.mon, weekday: m.weekday, year: m.year, matches: [] };
			byDate.set(m.isoDate, g);
			groups.push(g);
		}
		g.matches.push(m);
	}

	return (
		<>
			{/* HERO */}
			<section className="relative overflow-hidden border-b border-black/[0.08]">
				<div className="absolute inset-0" style={{ background: "radial-gradient(120% 80% at 82% -10%,rgba(228,0,43,0.12),transparent 58%)" }} />
				<div className="absolute -top-20 right-[-140px] h-[520px] w-[520px] rounded-full border border-brand/[0.14]" />
				<div className="relative mx-auto flex max-w-[1280px] flex-wrap items-end justify-between gap-6 px-8 pb-[44px] pt-[56px] max-[960px]:px-6">
					<div>
						<div className="mb-[18px] inline-flex items-center gap-[10px] font-mono text-[12px] uppercase tracking-[0.14em] text-brand">
							<span className="h-px w-[26px] bg-brand" />Final Scores{activeSeason ? ` · ${activeSeason}` : ""}
						</div>
						<h1 className="font-display text-[clamp(56px,8vw,120px)] uppercase leading-[0.86] tracking-[0.01em] text-ink">Results</h1>
					</div>
					<div className="flex items-center gap-3">
						<a href="/upcoming-fixtures" className="rounded border border-black/20 px-5 py-3 text-[12px] font-bold uppercase tracking-[0.04em] text-ink2 no-underline hover:border-brand hover:text-brand">
							Upcoming →
						</a>
						{seasons.length > 1 && (
							<div className="relative">
								<select
									value={activeSeason}
									onChange={(e) => setSeason(e.target.value)}
									className="cursor-pointer appearance-none rounded-md border border-black/15 bg-white py-[11px] pl-4 pr-9 font-body text-[13px] font-bold tracking-[0.04em] text-ink2 outline-none"
								>
									{seasons.map((s) => (
										<option key={s} value={s}>
											{s}
										</option>
									))}
								</select>
								<span className="pointer-events-none absolute right-[14px] top-1/2 -translate-y-1/2 text-[9px] text-muted">▼</span>
							</div>
						)}
					</div>
				</div>
			</section>

			{!hasAny ? (
				<section className="mx-auto max-w-[1280px] px-8 py-[72px] max-[960px]:px-6">
					<div className="flex flex-col items-center gap-3 rounded-[14px] border border-dashed border-black/[0.16] bg-paper2 px-8 py-20 text-center">
						<div className="font-display text-[24px] uppercase text-ink">No results yet</div>
						<p className="max-w-[400px] text-[15px] leading-[1.6] text-muted">
							{activeSeason ? `The ${activeSeason} hasn’t` : "This season hasn’t"} recorded any completed matches. Once games are played, final scores will appear here.
						</p>
					</div>
				</section>
			) : (
				<>
					{/* FEATURED LATEST RESULT */}
					<section className="mx-auto max-w-[1280px] px-8 pt-[48px] max-[960px]:px-6 max-[960px]:pt-9">
						<div className="relative overflow-hidden rounded-2xl border border-white/10 bg-night px-8 py-8 text-cream max-[600px]:px-5">
							<div className="absolute inset-0" style={{ background: "radial-gradient(90% 130% at 12% 50%,rgba(228,0,43,0.18),transparent 55%)" }} />
							<div className="relative">
								<div className="mb-6 flex items-center justify-between gap-3">
									<span className="font-mono text-[11px] uppercase tracking-[0.14em] text-brandsoft">Latest Result</span>
									<span className="font-mono text-[11px] text-muted2">{feature.weekday}, {feature.mon} {Number(feature.day)}</span>
								</div>
								<div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 max-[600px]:gap-2">
									<div className="flex flex-col items-center gap-3 text-center">
										<FeatureCrest logo={feature.homeLogo} abbr={feature.homeAbbr} alt={feature.home} color={feature.homeWin ? "#f6f2ec" : "#8a817a"} />
										<div className="font-display text-[19px] uppercase leading-none max-[600px]:text-[15px]" style={{ color: feature.homeWin ? "#f6f2ec" : "#8a817a" }}>{feature.home}</div>
									</div>
									<div className="flex flex-col items-center gap-1">
										<div className="font-display text-[54px] leading-none max-[600px]:text-[34px]">
											<span style={{ color: feature.homeWin ? "#f6f2ec" : "#8a817a" }}>{feature.homeScore}</span>
											<span className="mx-2 text-[#6b635a]">–</span>
											<span style={{ color: feature.awayWin ? "#f6f2ec" : "#8a817a" }}>{feature.awayScore}</span>
										</div>
										<span className="rounded bg-white/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-creamdim">Final · {feature.league}</span>
									</div>
									<div className="flex flex-col items-center gap-3 text-center">
										<FeatureCrest logo={feature.awayLogo} abbr={feature.awayAbbr} alt={feature.away} color={feature.awayWin ? "#f6f2ec" : "#8a817a"} />
										<div className="font-display text-[19px] uppercase leading-none max-[600px]:text-[15px]" style={{ color: feature.awayWin ? "#f6f2ec" : "#8a817a" }}>{feature.away}</div>
									</div>
								</div>
								<div className="mt-6 border-t border-white/10 pt-4 text-center font-body text-[14px] text-creamdim">{featureSummary(feature)}</div>
							</div>
						</div>
					</section>

					{/* LEAGUE FILTER */}
					{leagues.length > 1 && (
						<section className="mx-auto max-w-[1280px] px-8 pt-[36px] max-[960px]:px-6 max-[960px]:pt-7">
							<div className="flex flex-wrap items-center gap-2">
								<span className="mr-1 font-mono text-[11px] uppercase tracking-[0.1em] text-muted2">League</span>
								<button type="button" onClick={() => setLeague("all")} className={pillClass(activeLeague === "all")}>
									All
								</button>
								{leagues.map((lg) => (
									<button key={lg} type="button" onClick={() => setLeague(lg)} className={pillClass(activeLeague === lg)}>
										{lg}
									</button>
								))}
							</div>
						</section>
					)}

					{/* RESULTS LIST */}
					<section className="mx-auto max-w-[1000px] px-8 py-[36px] max-[960px]:px-6 max-[960px]:py-7">
						{groups.length > 0 ? (
							<div className="flex flex-col gap-9">
								{groups.map((g) => (
									<div key={g.isoDate}>
										<div className="mb-4 flex items-center gap-4">
											<div className="flex flex-col items-center justify-center rounded-lg bg-night px-3.5 py-2 text-center">
												<span className="font-display text-[22px] leading-none text-brand">{g.day}</span>
												<span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted2">{g.mon}</span>
											</div>
											<div>
												<div className="font-display text-[20px] uppercase leading-none text-ink">{g.weekday}</div>
												<div className="mt-1 font-mono text-[11px] uppercase tracking-[0.06em] text-muted2">
													{g.matches.length} {g.matches.length === 1 ? "match" : "matches"} · {g.year}
												</div>
											</div>
											<span className="ml-auto h-px flex-1 bg-black/[0.08] max-[600px]:hidden" />
										</div>

										<div className="flex flex-col gap-3">
											{g.matches.map((m) => (
												<a
													key={m.id}
													href={m.href}
													className="block rounded-xl border border-black/10 bg-white px-5 py-4 no-underline shadow-[0_1px_2px_rgba(20,16,9,0.04)] hover:border-brand/40"
												>
													<div className="mb-3 flex items-center justify-between gap-3">
														<span className="rounded px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em]" style={{ background: "rgba(20,16,9,0.06)", color: "#6f665c" }}>
															{m.league}
														</span>
														<span className="font-mono text-[11px] text-muted2">Final · {m.time}</span>
													</div>
													<div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
														<div className="flex items-center gap-3 justify-self-end text-right">
															<span className="font-body text-[15px] font-bold" style={{ color: m.homeWin ? WON : LOST }}>{m.home}</span>
															<Crest logo={m.homeLogo} abbr={m.homeAbbr} alt={m.home} />
														</div>
														<div className="font-display text-[24px] leading-none">
															<span style={{ color: m.homeWin ? WON : LOST }}>{m.homeScore}</span>
															<span className="mx-1.5 text-[#c9beb0]">–</span>
															<span style={{ color: m.awayWin ? WON : LOST }}>{m.awayScore}</span>
														</div>
														<div className="flex items-center gap-3">
															<Crest logo={m.awayLogo} abbr={m.awayAbbr} alt={m.away} />
															<span className="font-body text-[15px] font-bold" style={{ color: m.awayWin ? WON : LOST }}>{m.away}</span>
														</div>
													</div>
													<div className="mt-3 flex items-center justify-center border-t border-black/[0.06] pt-3 font-mono text-[11px] text-muted2">
														<span style={{ color: m.homeWin || m.awayWin ? "#1f9d55" : "#8a817a" }}>{winnerText(m)}</span>
													</div>
												</a>
											))}
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="flex flex-col items-center gap-3 rounded-[14px] border border-dashed border-black/[0.16] bg-paper2 px-8 py-16 text-center">
								<div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-panel font-mono text-[18px] text-muted2">◎</div>
								<div className="font-display text-[22px] uppercase text-ink">No {activeLeague} results</div>
								<p className="max-w-[360px] text-[14px] leading-[1.5] text-muted">No completed matches to show for this filter yet.</p>
							</div>
						)}
					</section>
				</>
			)}
		</>
	);
}

/** One-line recap of the featured result. */
function featureSummary(m: FixtureMatch): string {
	if (!m.homeWin && !m.awayWin) return "Both sides finished level.";
	const winner = m.homeWin ? m.home : m.away;
	const margin = Math.abs((m.homeScore ?? 0) - (m.awayScore ?? 0));
	return `${winner} edged it by ${margin} in a ${m.league} clash.`;
}

/** Large crest for the featured card: logo on white, else coloured initials. */
function FeatureCrest({ logo, abbr, alt, color }: { logo: string | null; abbr: string; alt: string; color: string }) {
	if (logo) {
		return <img src={logo} alt={alt} loading="lazy" className="h-[76px] w-[76px] rounded-full bg-white object-contain max-[600px]:h-14 max-[600px]:w-14" />;
	}
	return (
		<div className="flex h-[76px] w-[76px] items-center justify-center rounded-full font-display text-[26px] max-[600px]:h-14 max-[600px]:w-14" style={{ background: FEAT_CREST, color }}>
			{abbr}
		</div>
	);
}
