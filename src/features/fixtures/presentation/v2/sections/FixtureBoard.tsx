import { useFixturesStore } from "@/features/fixtures/presentation/stores/v2/useFixturesStore";
import { pillClass } from "@/features/home/presentation/v2/lib/tab-styles";
import TeamName from "@/features/teams/presentation/components/TeamName";
import type { FixtureMatch } from "@/features/fixtures/domain/entities/fixtures-v2";

interface Props {
	matches: FixtureMatch[];
	seasons: string[];
	defaultSeason: string;
}

const CREST_BG = "repeating-linear-gradient(45deg,#e7e2da,#e7e2da 4px,#f0ece5 4px,#f0ece5 8px)";

/** Segmented view toggle (Upcoming / Results). */
const segClass = (active: boolean) =>
	`cursor-pointer rounded-md border-none px-[18px] py-[9px] font-body text-[12px] uppercase tracking-[0.05em] ${
		active ? "bg-brand font-bold text-white" : "bg-transparent font-semibold text-muted"
	}`;

interface Group {
	isoDate: string;
	day: string;
	mon: string;
	weekday: string;
	year: number;
	matches: FixtureMatch[];
}

/** Small crest: team logo when present, else the two-letter initials.
 *  Shared with the Results board. */
export function Crest({ logo, abbr, alt }: { logo: string | null; abbr: string; alt: string }) {
	if (logo) {
		return <img src={logo} alt={alt} loading="lazy" className="h-9 w-9 flex-shrink-0 rounded-full border border-black/10 bg-white object-contain" />;
	}
	return (
		<span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full font-mono text-[10px] text-muted2" style={{ background: CREST_BG }}>
			{abbr}
		</span>
	);
}

/** Fixtures — season selector + Upcoming/Results toggle + league filter +
 *  date-grouped match list. React island; all three filters live in a Zustand
 *  store. Matches arrive with dates/times already formatted server-side. */
export default function FixtureBoard({ matches, seasons, defaultSeason }: Props) {
	const { season, view, league, setSeason, setView, setLeague } = useFixturesStore();

	// Guard each selection against stale values.
	const activeSeason = season && seasons.includes(season) ? season : defaultSeason;
	const seasonMatches = matches.filter((m) => m.season === activeSeason);

	const leagues = [...new Set(seasonMatches.map((m) => m.league))];
	const activeLeague = league === "all" || leagues.includes(league) ? league : "all";

	const isResults = view === "results";
	const filtered = seasonMatches
		.filter((m) => (isResults ? m.status === "done" : m.status !== "done"))
		.filter((m) => activeLeague === "all" || m.league === activeLeague)
		.sort((a, b) => (isResults ? b.ts - a.ts : a.ts - b.ts));

	// Group by match-day, preserving the sorted order.
	const groups: Group[] = [];
	const byDate = new Map<string, Group>();
	for (const m of filtered) {
		let g = byDate.get(m.isoDate);
		if (!g) {
			g = { isoDate: m.isoDate, day: m.day, mon: m.mon, weekday: m.weekday, year: m.year, matches: [] };
			byDate.set(m.isoDate, g);
			groups.push(g);
		}
		g.matches.push(m);
	}

	const emptyTitle = isResults ? "No results yet" : "No upcoming fixtures";
	const emptyBody = isResults
		? activeLeague === "all"
			? "Completed matches will appear here once games have been played this season."
			: `No ${activeLeague} results recorded yet for this season.`
		: activeLeague === "all"
			? "The schedule for this season hasn’t been published yet. Check back soon."
			: `No ${activeLeague} fixtures are scheduled right now.`;

	return (
		<>
			{/* HERO */}
			<section className="relative overflow-hidden border-b border-black/[0.08]">
				<div className="absolute inset-0" style={{ background: "radial-gradient(120% 80% at 82% -10%,rgba(228,0,43,0.12),transparent 58%)" }} />
				<div className="absolute -top-20 right-[-140px] h-[520px] w-[520px] rounded-full border border-brand/[0.14]" />
				<div className="relative mx-auto flex max-w-[1280px] flex-wrap items-end justify-between gap-6 px-8 pb-[44px] pt-[56px] max-[960px]:px-6">
					<div>
						<div className="mb-[18px] inline-flex items-center gap-[10px] font-mono text-[12px] uppercase tracking-[0.14em] text-brand">
							<span className="h-px w-[26px] bg-brand" />Match Calendar{activeSeason ? ` · ${activeSeason}` : ""}
						</div>
						<h1 className="font-display text-[clamp(56px,8vw,120px)] uppercase leading-[0.86] tracking-[0.01em] text-ink">Fixtures</h1>
					</div>
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
			</section>

			{/* CONTROLS */}
			<section className="border-b border-black/[0.08] bg-panel">
				<div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4 px-8 py-5 max-[960px]:px-6">
					<div className="inline-flex rounded-lg border border-black/[0.12] bg-white p-1">
						<button type="button" onClick={() => setView("upcoming")} className={segClass(!isResults)}>
							Upcoming
						</button>
						<button type="button" onClick={() => setView("results")} className={segClass(isResults)}>
							Results
						</button>
					</div>
					{leagues.length > 1 && (
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
					)}
				</div>
			</section>

			{/* FIXTURE LIST */}
			<section className="mx-auto max-w-[1000px] px-8 py-[48px] max-[960px]:px-6 max-[960px]:py-9">
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
									{g.matches.map((m) => {
										const scored = m.score !== "";
										const homeColor = scored ? (m.homeWin ? "#141009" : "#a49a8d") : "#1a1712";
										const awayColor = scored ? (m.awayWin ? "#141009" : "#a49a8d") : "#1a1712";
										const statusText = m.status === "done" ? "Final" : m.status === "live" ? "Live" : "Upcoming";
										const statusColor = m.status === "done" ? "#8a817a" : "#e4002b";
										return (
											<a
												key={m.id}
												href={m.href}
												className="block rounded-xl border border-black/10 bg-white px-5 py-4 no-underline shadow-[0_1px_2px_rgba(20,16,9,0.04)] hover:border-brand/40"
											>
												<div className="mb-3 flex items-center justify-between gap-3">
													<span className="rounded px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em]" style={{ background: "rgba(20,16,9,0.06)", color: "#6f665c" }}>
														{m.league}
													</span>
													<span className="font-mono text-[11px]" style={{ color: statusColor }}>
														{statusText}
													</span>
												</div>
												<div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
													<TeamName
														team={{ name: m.home, nickname: m.homeNickname, logo: m.homeLogo, initials: m.homeAbbr }}
														variant="compact"
														withCrest
														crestPosition="end"
														align="right"
														className="justify-self-stretch font-body text-[15px] font-bold"
														textStyle={{ color: homeColor }}
													/>
													<div className="flex flex-col items-center">
														{scored ? (
															<span className="font-display text-[24px] leading-none text-ink">{m.score}</span>
														) : (
															<span className="font-display text-[16px] leading-none text-[#6b635a]">VS</span>
														)}
													</div>
													<TeamName
														team={{ name: m.away, nickname: m.awayNickname, logo: m.awayLogo, initials: m.awayAbbr }}
														variant="compact"
														withCrest
														className="justify-self-stretch font-body text-[15px] font-bold"
														textStyle={{ color: awayColor }}
													/>
												</div>
												<div className="mt-3 flex items-center justify-center gap-2 border-t border-black/[0.06] pt-3 font-mono text-[11px] text-muted2">
													<span>{m.time}</span>
												</div>
											</a>
										);
									})}
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="flex flex-col items-center gap-3 rounded-[14px] border border-dashed border-black/[0.16] bg-paper2 px-8 py-20 text-center">
						<div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-panel">
							<div className="relative h-[22px] w-[22px] rounded-full border-2 border-[#b3a99c]">
								<span className="absolute bottom-0 left-1/2 top-0 w-0.5 -translate-x-1/2 bg-[#b3a99c]" />
								<span className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-[#b3a99c]" />
							</div>
						</div>
						<div className="font-display text-[22px] uppercase text-ink">{emptyTitle}</div>
						<p className="max-w-[380px] text-[14px] leading-[1.5] text-muted">{emptyBody}</p>
					</div>
				)}
			</section>
		</>
	);
}
