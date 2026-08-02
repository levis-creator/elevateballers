import { useEffect, useState } from "react";
import { useResultsStore } from "@/features/fixtures/presentation/stores/v2/useResultsStore";
import { pillClass } from "@/features/home/presentation/v2/lib/tab-styles";
import TeamName from "@/features/teams/presentation/components/TeamName";
import type { FixtureMatch } from "@/features/fixtures/domain/entities/fixtures-v2";
import type { PublicCompetitionOption } from "@/features/seasons/domain/entities/public-competition";
import type { PublicCompetitionSettings } from "@/features/settings/application/competitionSettings";
import { resultsToken, type PublicResultsSettings } from "@/features/settings/application/resultsSettings";

interface Props {
	/** All matches for the site; the board keeps only completed ("done") games. */
	matches: FixtureMatch[];
	seasons: string[];
	defaultSeason: string;
	competitions: PublicCompetitionOption[];
	defaultLeagueSeasonId: string;
	competitionSettings: PublicCompetitionSettings;
	settings: PublicResultsSettings;
}

const WON = "var(--ink,#141009)";
const LOST = "var(--muted2,#a49a8d)";

interface Group {
	key: string;
	label: string;
	meta: string;
	day?: string;
	mon?: string;
	matches: FixtureMatch[];
}

const winnerText = (m: FixtureMatch): string =>
	m.homeWin ? `${m.home} win` : m.awayWin ? `${m.away} win` : "Draw";

/** Results — hero + featured latest result + league filter + date-grouped final
 *  scores. React island; season and league filters live in a Zustand store.
 *  Reuses the Fixtures data layer (completed matches only). */
export default function ResultsBoard({ matches, seasons, defaultSeason, competitionSettings, settings }: Props) {
	const { season, league, setSeason, setLeague } = useResultsStore();
	const [page, setPage] = useState(1);

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
	const allowAll = Boolean(competitionSettings.allLabel);
	const activeLeague = allowAll && league === "all" ? "all" : leagues.includes(league) ? league : (leagues[0] ?? "all");
	const list = activeLeague === "all" ? seasonDone : seasonDone.filter((m) => m.league === activeLeague);
	useEffect(() => { setPage(1); }, [activeSeason, activeLeague, settings.perPage, settings.groupBy]);
	const totalPages = Math.max(1, Math.ceil(list.length / settings.perPage));
	const safePage = Math.min(page, totalPages);
	const pagedList = list.slice((safePage - 1) * settings.perPage, safePage * settings.perPage);

	// Group the configured page by date, round or each participating team.
	const groups: Group[] = [];
	const byDate = new Map<string, Group>();
	for (const m of pagedList) {
		const keys = settings.groupBy === "Team" ? [m.home, m.away] : [settings.groupBy === "Round" ? m.round : m.isoDate];
		for (const key of keys) {
			let g = byDate.get(key);
			if (!g) {
				g = settings.groupBy === "Date"
					? { key, label: m.weekday, meta: `${m.year}`, day: m.day, mon: m.mon, matches: [] }
					: { key, label: key, meta: settings.groupBy, matches: [] };
				byDate.set(key, g); groups.push(g);
			}
			g.matches.push(m);
		}
	}
	const nightPerformers = [...new Map(list.filter((match) => match.performer).map((match) => [match.isoDate, match])).values()].slice(0, 6);
	const heroSeason = competitionSettings.seasonLabel ? activeSeason.replace(new RegExp(`\\s+${competitionSettings.seasonLabel}$`, "i"), "") : activeSeason;

	return (
		<>
			{/* HERO */}
			<section className="relative overflow-hidden border-b border-black/[0.08]">
				<div className="absolute inset-0" style={{ background: "radial-gradient(120% 80% at 82% -10%,rgb(var(--site-brand-rgb) / 0.12),transparent 58%)" }} />
				<div className="absolute -top-20 right-[-140px] h-[520px] w-[520px] rounded-full border border-brand/[0.14]" />
				<div className="relative mx-auto flex max-w-[1280px] flex-wrap items-end justify-between gap-6 px-8 pb-[44px] pt-[56px] max-[960px]:px-6">
					<div>
						<div className="mb-[18px] inline-flex items-center gap-[10px] font-mono text-[12px] uppercase tracking-[0.14em] text-brand">
							<span className="h-px w-[26px] bg-brand" />{resultsToken(settings.eyebrow, heroSeason)}
						</div>
						<h1 className="font-display text-[clamp(56px,8vw,120px)] uppercase leading-[0.86] tracking-[0.01em] text-ink">{settings.title}</h1>
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
						<div className="font-display text-[24px] uppercase text-ink">{settings.emptyTitle}</div>
						<p className="max-w-[400px] text-[15px] leading-[1.6] text-muted">{settings.emptyBody}</p>
					</div>
				</section>
			) : (
				<>
					{/* FEATURED LATEST RESULT */}
					<section className="mx-auto max-w-[1280px] px-8 pt-[48px] max-[960px]:px-6 max-[960px]:pt-9">
						<div className="relative overflow-hidden rounded-2xl border border-white/10 bg-night px-8 py-8 text-cream max-[600px]:px-5">
							<div className="absolute inset-0" style={{ background: "radial-gradient(90% 130% at 12% 50%,rgb(var(--site-brand-rgb) / 0.18),transparent 55%)" }} />
							<div className="relative">
								<div className="mb-6 flex items-center justify-between gap-3">
									<span className="font-mono text-[11px] uppercase tracking-[0.14em] text-brandsoft">Latest Result</span>
									<span className="font-mono text-[11px] text-muted2">{feature.weekday}, {feature.mon} {Number(feature.day)}</span>
								</div>
								<div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 max-[600px]:gap-2">
									<TeamName
										team={{ name: feature.home, nickname: feature.homeNickname, logo: feature.homeLogo, initials: feature.homeAbbr }}
										variant="compact"
										withCrest
										align="center"
										className="flex-col gap-3 font-display text-[19px] uppercase leading-none max-[600px]:text-[15px]"
										crestClassName="h-[76px] w-[76px] max-[600px]:h-14 max-[600px]:w-14"
										textStyle={{ color: !settings.winnerHighlight || feature.homeWin ? "var(--cream,#f6f2ec)" : "var(--muted2,#8a817a)" }}
									/>
									<div className="flex flex-col items-center gap-1">
										<div className="font-display text-[54px] leading-none max-[600px]:text-[34px]">
											<span style={{ color: !settings.winnerHighlight || feature.homeWin ? "var(--cream,#f6f2ec)" : "var(--muted2,#8a817a)" }}>{feature.homeScore}</span>
											<span className="mx-2 text-[#6b635a]">–</span>
											<span style={{ color: !settings.winnerHighlight || feature.awayWin ? "var(--cream,#f6f2ec)" : "var(--muted2,#8a817a)" }}>{feature.awayScore}</span>
										</div>
										<span className="rounded bg-white/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-creamdim">Final · {feature.league}</span>
									</div>
									<TeamName
										team={{ name: feature.away, nickname: feature.awayNickname, logo: feature.awayLogo, initials: feature.awayAbbr }}
										variant="compact"
										withCrest
										align="center"
										className="flex-col gap-3 font-display text-[19px] uppercase leading-none max-[600px]:text-[15px]"
										crestClassName="h-[76px] w-[76px] max-[600px]:h-14 max-[600px]:w-14"
										textStyle={{ color: !settings.winnerHighlight || feature.awayWin ? "var(--cream,#f6f2ec)" : "var(--muted2,#8a817a)" }}
									/>
								</div>
								<div className="mt-6 border-t border-white/10 pt-4 text-center font-body text-[14px] text-creamdim">{featureSummary(feature)}</div>
							</div>
						</div>
					</section>
					{settings.leadersStrip && nightPerformers.length > 0 && <section className="mx-auto max-w-[1280px] px-8 pt-6 max-[960px]:px-6">
						<div className="mb-3 font-mono text-[11px] uppercase tracking-[0.12em] text-brand">Top performers</div>
						<div className="flex gap-3 overflow-x-auto pb-2">
							{nightPerformers.map((match) => match.performer && <a key={match.id} href={settings.boxLink ? match.href : undefined} className="flex min-w-[240px] items-center gap-3 rounded-xl border border-black/10 bg-white p-4 text-ink no-underline">
								{match.performer.image ? <img src={match.performer.image} alt="" className="h-11 w-11 rounded-full object-cover" /> : <span className="flex h-11 w-11 items-center justify-center rounded-full bg-paper2 font-display text-brand">{match.performer.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("")}</span>}
								<span className="min-w-0"><strong className="block truncate text-[13px]">{match.performer.name}</strong><small className="font-mono text-[10px] text-muted2">{match.performer.team} · {match.performer.pts} PTS · {match.performer.reb} REB · {match.performer.ast} AST</small></span>
							</a>)}
						</div>
					</section>}

					{/* LEAGUE FILTER */}
					{leagues.length > 1 && (
						<section className="mx-auto max-w-[1280px] px-8 pt-[36px] max-[960px]:px-6 max-[960px]:pt-7">
							<div className="flex flex-wrap items-center gap-2">
								<span className="mr-1 font-mono text-[11px] uppercase tracking-[0.1em] text-muted2">League</span>
								{allowAll && <button type="button" onClick={() => setLeague("all")} className={pillClass(activeLeague === "all")}>
									{competitionSettings.allLabel}
								</button>}
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
									<div key={g.key}>
										<div className="mb-4 flex items-center gap-4">
											{g.day && <div className="flex flex-col items-center justify-center rounded-lg bg-night px-3.5 py-2 text-center">
												<span className="font-display text-[22px] leading-none text-brand">{g.day}</span>
												<span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted2">{g.mon}</span>
											</div>}
											<div>
												<div className="font-display text-[20px] uppercase leading-none text-ink">{g.label}</div>
												<div className="mt-1 font-mono text-[11px] uppercase tracking-[0.06em] text-muted2">
													{g.matches.length} {g.matches.length === 1 ? "match" : "matches"} · {g.meta}
												</div>
											</div>
											<span className="ml-auto h-px flex-1 bg-black/[0.08] max-[600px]:hidden" />
										</div>

										<div className="flex flex-col gap-3">
											{g.matches.map((m) => (
											<a
												key={m.id}
												href={settings.boxLink ? m.href : undefined}
												aria-disabled={!settings.boxLink}
												className={`block rounded-xl border border-black/10 bg-white px-5 py-4 no-underline shadow-[0_1px_2px_rgb(var(--site-ink-rgb)/0.04)] ${settings.boxLink ? "hover:border-brand/40" : "cursor-default"}`}
												>
													<div className="mb-3 flex items-center justify-between gap-3">
														<span className="rounded px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em]" style={{ background: "rgb(var(--site-ink-rgb)/0.06)", color: "var(--muted,#6f665c)" }}>
															{m.leagueCode || m.league}
														</span>
														<span className="font-mono text-[11px] text-muted2">Final · {m.time}</span>
													</div>
													<div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
														<TeamName
															team={{ name: m.home, nickname: m.homeNickname, logo: m.homeLogo, initials: m.homeAbbr }}
															variant="compact"
															withCrest
															crestPosition="end"
															align="right"
															className="justify-self-stretch font-body text-[15px] font-bold"
													textStyle={{ color: !settings.winnerHighlight || m.homeWin ? WON : LOST }}
														/>
														<div className="font-display text-[24px] leading-none">
													<span style={{ color: !settings.winnerHighlight || m.homeWin ? WON : LOST }}>{m.homeScore}</span>
															<span className="mx-1.5 text-[#c9beb0]">–</span>
													<span style={{ color: !settings.winnerHighlight || m.awayWin ? WON : LOST }}>{m.awayScore}</span>
														</div>
														<TeamName
															team={{ name: m.away, nickname: m.awayNickname, logo: m.awayLogo, initials: m.awayAbbr }}
															variant="compact"
															withCrest
															className="justify-self-stretch font-body text-[15px] font-bold"
													textStyle={{ color: !settings.winnerHighlight || m.awayWin ? WON : LOST }}
														/>
													</div>
													<div className="mt-3 flex items-center justify-center border-t border-black/[0.06] pt-3 font-mono text-[11px] text-muted2">
														<span style={{ color: m.homeWin || m.awayWin ? "#1f9d55" : "var(--muted2,#8a817a)" }}>{winnerText(m)}</span>
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
								<div className="font-display text-[22px] uppercase text-ink">{settings.emptyTitle}</div>
								<p className="max-w-[360px] text-[14px] leading-[1.5] text-muted">{activeLeague === "all" ? settings.emptyBody : resultsToken(settings.emptyBodyFiltered, matches.find((match) => match.league === activeLeague)?.leagueCode || activeLeague)}</p>
							</div>
						)}
						{totalPages > 1 && <div className="mt-7 flex items-center justify-between border-t border-black/[0.08] pt-5">
							<span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted2">Page {safePage} of {totalPages}</span>
							<div className="flex gap-2"><button type="button" disabled={safePage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-md border border-black/15 px-4 py-2 text-[11px] font-bold uppercase disabled:opacity-35">Previous</button><button type="button" disabled={safePage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="rounded-md border border-black/15 px-4 py-2 text-[11px] font-bold uppercase disabled:opacity-35">Next</button></div>
						</div>}
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
