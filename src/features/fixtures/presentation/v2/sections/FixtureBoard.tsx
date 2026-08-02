import { useEffect, useState } from "react";
import { useFixturesStore } from "@/features/fixtures/presentation/stores/v2/useFixturesStore";
import { pillClass } from "@/features/home/presentation/v2/lib/tab-styles";
import TeamName from "@/features/teams/presentation/components/TeamName";
import type { FixtureMatch } from "@/features/fixtures/domain/entities/fixtures-v2";
import type { PublicCompetitionOption } from "@/features/seasons/domain/entities/public-competition";
import { configuredDefaultCompetitionId, type PublicCompetitionSettings } from "@/features/settings/application/competitionSettings";
import { fixturesToken, type PublicFixturesSettings } from "@/features/settings/application/fixturesSettings";

interface Props {
	matches: FixtureMatch[];
	seasons: string[];
	defaultSeason: string;
	competitions: PublicCompetitionOption[];
	defaultLeagueSeasonId: string;
	competitionSettings: PublicCompetitionSettings;
	settings: PublicFixturesSettings;
}

const CREST_BG = "repeating-linear-gradient(45deg,rgb(var(--site-paper-border-rgb,231 226 218)),rgb(var(--site-paper-border-rgb,231 226 218)) 4px,var(--panel,#f0ece5) 4px,var(--panel,#f0ece5) 8px)";

/** Segmented view toggle (Upcoming / Results). */
const segClass = (active: boolean) =>
	`cursor-pointer rounded-md border-none px-[18px] py-[9px] font-body text-[12px] uppercase tracking-[0.05em] ${
		active ? "bg-brand font-bold text-brandfg" : "bg-transparent font-semibold text-muted"
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
export default function FixtureBoard({ matches, competitions, defaultLeagueSeasonId, competitionSettings, settings }: Props) {
	const { leagueSeasonId, seasonId, conferenceId, view, setLeagueSeason, setSeason, setConference, setView } = useFixturesStore();
	const storedLeague = settings.leagueFilter ? competitions.find((item) => item.id === leagueSeasonId) : undefined;
	const configuredDefaultId = configuredDefaultCompetitionId(competitions, competitionSettings, defaultLeagueSeasonId);
	const defaultCompetition = competitions.find((item) => item.id === configuredDefaultId) ?? competitions[0];
	const selectedLeague = storedLeague ?? (
		settings.leagueFilter &&
		(competitionSettings.defaultLeague !== "Remember last choice" || !competitionSettings.allLabel)
			? defaultCompetition
			: undefined
	);
	const isOverall = !settings.leagueFilter || (Boolean(competitionSettings.allLabel) && !selectedLeague);
	useEffect(() => {
		if (competitionSettings.defaultLeague !== "Remember last choice") return;
		const remembered = window.localStorage.getItem("eb-public-league-season");
		if (remembered && competitions.some((item) => item.id === remembered)) setLeagueSeason(remembered);
	}, []);
	useEffect(() => {
		if (competitionSettings.defaultLeague === "Remember last choice" && leagueSeasonId) window.localStorage.setItem("eb-public-league-season", leagueSeasonId);
	}, [leagueSeasonId, competitionSettings.defaultLeague]);
	const seasonIds = [...new Set(competitions.map((item) => item.seasonId))];
	const activeSeasonId = seasonId || selectedLeague?.seasonId || defaultCompetition?.seasonId;
	const seasonCompetitions = competitions.filter((item) => item.seasonId === activeSeasonId);
	const selected = selectedLeague ?? seasonCompetitions[0] ?? defaultCompetition;
	const activeCompetitionIds = new Set(seasonCompetitions.map((item) => item.id));
	const showConferences = !isOverall && selected?.structure === "CONFERENCES" && selected.conferences.length > 0;
	const activeConferenceId = showConferences && selected.conferences.some((item) => item.id === conferenceId) ? conferenceId : "";

	const isResults = settings.viewTabs && view === "results";
	const horizonEnd = Date.now() + settings.horizon * 24 * 60 * 60 * 1000;
	const filtered = matches
		.filter((m) => isOverall ? activeCompetitionIds.has(m.leagueSeasonId ?? "") : m.leagueSeasonId === selectedLeague?.id)
		.filter((m) => !activeConferenceId || m.conferenceIds.includes(activeConferenceId))
		.filter((m) => (isResults ? m.status === "done" : m.status !== "done"))
		.filter((m) => isResults || m.status === "live" || m.ts <= horizonEnd)
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
	const [dayIndex, setDayIndex] = useState(0);
	useEffect(() => { setDayIndex(0); }, [leagueSeasonId, seasonId, conferenceId, view]);
	const safeDayIndex = Math.min(dayIndex, Math.max(0, groups.length - 1));
	const displayedGroups = settings.dayNav ? groups.slice(safeDayIndex, safeDayIndex + 1) : groups;

	const emptyTitle = isResults ? "No results yet" : settings.emptyTitle;
	const emptyBody = isResults
		? "Completed matches will appear here once games have been played this season."
		: selectedLeague ? fixturesToken(settings.emptyBodyFiltered, selectedLeague.leagueCode || selectedLeague.leagueLabel) : settings.emptyBody;
	const heroSeason = competitionSettings.seasonLabel
		? (selected?.seasonLabel ?? "").replace(new RegExp(`\\s+${competitionSettings.seasonLabel}$`, "i"), "")
		: selected?.seasonLabel ?? "";

	return (
		<>
			{/* HERO */}
			<section className="relative overflow-hidden border-b border-black/[0.08]">
				<div className="absolute inset-0" style={{ background: "radial-gradient(120% 80% at 82% -10%,rgb(var(--site-brand-rgb) / 0.12),transparent 58%)" }} />
				<div className="absolute -top-20 right-[-140px] h-[520px] w-[520px] rounded-full border border-brand/[0.14]" />
				<div className="relative mx-auto flex max-w-[1280px] flex-wrap items-end justify-between gap-6 px-8 pb-[44px] pt-[56px] max-[960px]:px-6">
					<div>
						<div className="mb-[18px] inline-flex items-center gap-[10px] font-mono text-[12px] uppercase tracking-[0.14em] text-brand">
							<span className="h-px w-[26px] bg-brand" />{fixturesToken(settings.eyebrow, heroSeason)}
						</div>
						<h1 className="font-display text-[clamp(56px,8vw,120px)] uppercase leading-[0.86] tracking-[0.01em] text-ink">{settings.title}</h1>
					</div>
					{seasonIds.length > 1 && selected && (
						<div className="relative">
							<select
								value={activeSeasonId}
								onChange={(e) => {
									setSeason(e.target.value);
									if (isOverall) {
										return;
									}
									const next = competitions.find((item) => item.seasonId === e.target.value);
									if (next) {
										setSeason(next.seasonId);
										setLeagueSeason(next.id);
									}
								}}
								className="cursor-pointer appearance-none rounded-md border border-black/15 bg-white py-[11px] pl-4 pr-9 font-body text-[13px] font-bold tracking-[0.04em] text-ink2 outline-none"
							>
								{seasonIds.map((id) => (
									<option key={id} value={id}>
										{competitions.find((item) => item.seasonId === id)?.seasonLabel}
									</option>
								))}
							</select>
							<span className="pointer-events-none absolute right-[14px] top-1/2 -translate-y-1/2 text-[9px] text-muted">▼</span>
						</div>
					)}
				</div>
			</section>
			{settings.browseRow && <nav aria-label="Browse competition pages" className="border-b border-black/[0.08] bg-white">
				<div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-2 px-8 py-3 max-[960px]:px-6">
					<span className="mr-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted2">Browse</span>
					{[["Teams", "/teams"], ["Standings", "/standings"], [settings.title, "/upcoming-fixtures"], ["Results", "/matches"]].map(([label, href]) => <a key={href} href={href} className={`rounded-md px-3 py-2 text-[11px] font-bold uppercase tracking-[0.05em] no-underline ${href === "/upcoming-fixtures" ? "bg-brand text-brandfg" : "text-muted hover:text-brand"}`}>{label}</a>)}
				</div>
			</nav>}

			{/* CONTROLS */}
			<section className="border-b border-black/[0.08] bg-panel">
				<div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4 px-8 py-5 max-[960px]:px-6">
					{settings.viewTabs && <div className="inline-flex rounded-lg border border-black/[0.12] bg-white p-1">
						<button type="button" onClick={() => setView("upcoming")} className={segClass(!isResults)}>
							Upcoming
						</button>
						<button type="button" onClick={() => setView("results")} className={segClass(isResults)}>
							Results
						</button>
					</div>}
					{settings.leagueFilter && selected && (
						<div className="flex flex-wrap items-center gap-2">
							<span className="mr-1 font-mono text-[11px] uppercase tracking-[0.1em] text-muted2">Competition</span>
							{competitionSettings.allLabel && <button type="button" onClick={() => setLeagueSeason("")} className={pillClass(isOverall)}>
								{competitionSettings.allLabel}
							</button>}
							{seasonCompetitions.map((item) => (
								<button key={item.id} type="button" onClick={() => { setSeason(item.seasonId); setLeagueSeason(item.id); }} className={pillClass(!isOverall && selectedLeague?.id === item.id)}>
									{item.leagueLabel}
								</button>
							))}
							{showConferences && <>
								<span className="ml-2 font-mono text-[11px] uppercase tracking-[0.1em] text-muted2">Conference</span>
								<button type="button" onClick={() => setConference("")} className={pillClass(!activeConferenceId)}>All</button>
								{selected.conferences.map((item) => <button key={item.id} type="button" onClick={() => setConference(item.id)} className={pillClass(activeConferenceId === item.id)}>{item.name}</button>)}
							</>}
						</div>
					)}
				</div>
			</section>

			{/* FIXTURE LIST */}
			<section className="mx-auto max-w-[1000px] px-8 py-[48px] max-[960px]:px-6 max-[960px]:py-9">
				{settings.dayNav && groups.length > 0 && <div className="mb-5 flex items-center justify-between rounded-xl border border-black/10 bg-white px-4 py-3">
					<button type="button" disabled={safeDayIndex === 0} onClick={() => setDayIndex((index) => Math.max(0, index - 1))} className="rounded-md border border-black/10 px-3 py-2 text-[11px] font-bold uppercase disabled:opacity-35">← Previous day</button>
					<span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">{groups[safeDayIndex]?.weekday} · {groups[safeDayIndex]?.day} {groups[safeDayIndex]?.mon}</span>
					<button type="button" disabled={safeDayIndex >= groups.length - 1} onClick={() => setDayIndex((index) => Math.min(groups.length - 1, index + 1))} className="rounded-md border border-black/10 px-3 py-2 text-[11px] font-bold uppercase disabled:opacity-35">Next day →</button>
				</div>}
				{groups.length > 0 ? (
					<div className="flex flex-col gap-9">
						{displayedGroups.map((g) => (
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
										const homeColor = scored ? (m.homeWin ? "var(--ink,#141009)" : "var(--muted2,#a49a8d)") : "var(--night2,#1a1712)";
										const awayColor = scored ? (m.awayWin ? "var(--ink,#141009)" : "var(--muted2,#a49a8d)") : "var(--night2,#1a1712)";
										const statusText = m.status === "done" ? "Final" : m.status === "live" ? "Live" : "Upcoming";
										const statusColor = m.status === "done" ? "var(--muted2,#8a817a)" : "var(--brand)";
										return (
										<div
											key={m.id}
											role="link"
											tabIndex={0}
											onClick={() => { window.location.href = m.href; }}
											onKeyDown={(event) => { if (event.key === "Enter") window.location.href = m.href; }}
											className="block cursor-pointer rounded-xl border border-black/10 bg-white px-5 py-4 no-underline shadow-[0_1px_2px_rgb(var(--site-ink-rgb)/0.04)] hover:border-brand/40"
											>
												<div className="mb-3 flex items-center justify-between gap-3">
											{settings.leagueTag && <span className="rounded px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em]" style={{ background: "rgb(var(--site-ink-rgb)/0.06)", color: "var(--muted,#6f665c)" }}>
												{m.leagueCode || m.league}
											</span>}
													<span className="font-mono text-[11px]" style={{ color: statusColor }}>
														{statusText}
													</span>
												</div>
												<div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
													<TeamName
														team={{ name: m.home, nickname: m.homeNickname, logo: m.homeLogo, initials: m.homeAbbr }}
														variant="compact"
													withCrest={settings.crests}
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
													withCrest={settings.crests}
														className="justify-self-stretch font-body text-[15px] font-bold"
														textStyle={{ color: awayColor }}
													/>
												</div>
												<div className="mt-3 flex items-center justify-center gap-2 border-t border-black/[0.06] pt-3 font-mono text-[11px] text-muted2">
												<span>{m.time}{settings.venue && m.venue ? ` · ${m.venue}` : ""}</span>
												{settings.ics && (m.homeTeamId || m.awayTeamId) && <span className="ml-2 flex gap-2">
													{m.homeTeamId && <a href={`/api/calendar/teams/${m.homeTeamId}.ics`} download onClick={(event) => event.stopPropagation()} className="text-brand no-underline">{m.homeAbbr} .ics</a>}
													{m.awayTeamId && <a href={`/api/calendar/teams/${m.awayTeamId}.ics`} download onClick={(event) => event.stopPropagation()} className="text-brand no-underline">{m.awayAbbr} .ics</a>}
												</span>}
												</div>
										</div>
										);
									})}
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="flex flex-col items-center gap-3 rounded-[14px] border border-dashed border-black/[0.16] bg-paper2 px-8 py-20 text-center">
						<div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-panel">
							<div className="relative h-[22px] w-[22px] rounded-full border-2 border-[var(--muted2,#b3a99c)]">
								<span className="absolute bottom-0 left-1/2 top-0 w-0.5 -translate-x-1/2 bg-[var(--muted2,#b3a99c)]" />
								<span className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-[var(--muted2,#b3a99c)]" />
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
