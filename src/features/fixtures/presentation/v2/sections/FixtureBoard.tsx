import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useFixturesStore } from "@/features/fixtures/presentation/stores/v2/useFixturesStore";
import type { FixtureMatch, PlayoffStage } from "@/features/fixtures/domain/entities/fixtures-v2";
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
	liveBadge: string;
}

const CREST_BG = "repeating-linear-gradient(45deg,rgb(var(--site-paper-border-rgb,231 226 218)),rgb(var(--site-paper-border-rgb,231 226 218)) 4px,var(--panel,#f0ece5) 4px,var(--panel,#f0ece5) 8px)";
const DARK_CREST_BG = "repeating-linear-gradient(45deg,#1a1714,#1a1714 6px,#151210 6px,#151210 12px)";
const BRAND = "var(--brand,#e4002b)";
const BRAND_SOFT = "var(--brandsoft,#ff5a72)";
const brandA = (alpha: number) => `rgb(var(--site-brand-rgb,228 0 43) / ${alpha})`;
const softA = (alpha: number) => `rgb(var(--site-brand-soft-rgb,255 90 114) / ${alpha})`;
const GOLD = "#e2b04a";
const goldA = (alpha: number) => `rgba(226,176,74,${alpha})`;
const LIGHT = "#f6f2ec";
const DIM = "#8a817a";

/** Knockout rounds escalate visually: QF (red edge) → SF (red glow) → Final (gold). */
interface StageStyle {
	round: string;
	mark: string;
	label: string;
	phase: string;
	next: string;
	accent: string;
	soft: string;
	card: CSSProperties;
	bar: CSSProperties;
	glow: CSSProperties;
	markStyle: CSSProperties;
}

const STAGE_ORDER: PlayoffStage[] = ["PO", "QF", "SF", "F"];

const STAGES: Record<PlayoffStage, StageStyle> = {
	PO: {
		round: "Playoff", mark: "PO", label: "Playoffs", phase: "Playoffs", next: "next round", accent: BRAND_SOFT, soft: brandA(0.45),
		card: { border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 10px 30px rgba(12,11,10,0.18)" },
		bar: { height: 3, background: BRAND },
		glow: { background: `radial-gradient(70% 140% at 0% 0%,${brandA(0.22)},transparent 60%)` },
		markStyle: { color: "transparent", WebkitTextStroke: `1.5px ${softA(0.18)}` },
	},
	QF: {
		round: "Quarterfinal", mark: "QF", label: "Quarterfinals", phase: "Quarterfinals", next: "semifinals", accent: BRAND_SOFT, soft: brandA(0.45),
		card: { border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 10px 30px rgba(12,11,10,0.18)" },
		bar: { height: 3, background: BRAND },
		glow: { background: `radial-gradient(70% 140% at 0% 0%,${brandA(0.22)},transparent 60%)` },
		markStyle: { color: "transparent", WebkitTextStroke: `1.5px ${softA(0.18)}` },
	},
	SF: {
		round: "Semifinal", mark: "SF", label: "Semifinals", phase: "Semifinals", next: "Final", accent: BRAND_SOFT, soft: softA(0.7),
		card: { border: `1px solid ${brandA(0.55)}`, boxShadow: `0 14px 44px ${brandA(0.24)}` },
		bar: { height: 4, background: `linear-gradient(90deg,${BRAND},${BRAND_SOFT} 50%,${BRAND})` },
		glow: { background: `radial-gradient(60% 140% at 0% 0%,${brandA(0.34)},transparent 60%),radial-gradient(60% 140% at 100% 100%,${brandA(0.24)},transparent 60%)` },
		markStyle: { color: "transparent", WebkitTextStroke: `1.5px ${softA(0.26)}` },
	},
	F: {
		round: "The Final", mark: "Final", label: "Championship Final", phase: "Final", next: "", accent: GOLD, soft: goldA(0.8),
		card: { border: `1px solid ${goldA(0.6)}`, boxShadow: `0 18px 56px ${goldA(0.22)},0 0 0 4px ${goldA(0.08)}` },
		bar: { height: 5, background: "linear-gradient(90deg,#7a5c1e,#e2b04a 30%,#f6dc96 50%,#e2b04a 70%,#7a5c1e)" },
		glow: { background: `radial-gradient(70% 160% at 50% -30%,${goldA(0.28)},transparent 60%),radial-gradient(50% 120% at 100% 120%,${brandA(0.22)},transparent 60%)` },
		markStyle: { color: "transparent", WebkitTextStroke: `1.5px ${goldA(0.3)}` },
	},
};

const STATUS_LABEL: Record<string, string> = {
	REGISTRATION: "Registration open",
	SCHEDULED: "Scheduled",
	ACTIVE: "Regular season",
	PLAYOFFS: "Playoffs",
	COMPLETED: "Completed",
};

const stageOf = (m: FixtureMatch): StageStyle | null => (m.stage ? STAGES[m.stage] : null);
const scoredOf = (m: FixtureMatch) => m.score !== "";
const winnerOf = (m: FixtureMatch) => (m.homeWin ? m.home : m.awayWin ? m.away : "");
const codeOf = (c: PublicCompetitionOption) => c.leagueCode || c.leagueLabel.split(/\s+/).map((w) => w[0]).join("").slice(0, 4).toUpperCase();

/** Segmented view toggle (Upcoming / Results). */
const segClass = (active: boolean) =>
	`cursor-pointer rounded-md border-none px-[18px] py-[9px] font-body text-[12px] uppercase tracking-[0.05em] ${
		active ? "bg-brand font-bold text-brandfg" : "bg-transparent font-semibold text-muted"
	}`;

/** Conference pill. */
const pillClass = (active: boolean) =>
	`cursor-pointer rounded-md px-[14px] py-2 font-body text-[12px] uppercase tracking-[0.04em] ${
		active ? "border border-night bg-night font-bold text-white" : "border border-black/15 bg-white font-semibold text-muted hover:border-brand"
	}`;

/** Earlier / Later day-nav button. */
const navClass = (enabled: boolean) =>
	`rounded-md px-[14px] py-[9px] font-body text-[12px] font-bold uppercase tracking-[0.04em] ${
		enabled ? "cursor-pointer border border-black/15 bg-white text-ink2" : "cursor-default border border-black/[0.08] bg-[#f0ede7] text-[#b3a99c]"
	}`;

interface Group {
	isoDate: string;
	day: string;
	mon: string;
	weekday: string;
	year: number;
	matches: FixtureMatch[];
}

interface Phase {
	label: string;
	date: string;
	accent: string;
	isFinal: boolean;
	matches: FixtureMatch[];
}

/** Season path for one competition, derived from its scheduled games:
 *  regular season (month span) followed by each knockout round present. */
function phasesOf(all: FixtureMatch[]): { phases: Phase[]; current: number; champion: string } {
	const sorted = [...all].sort((a, b) => a.ts - b.ts);
	const phases: Phase[] = [];
	const regular = sorted.filter((m) => !m.stage);
	if (regular.length) {
		const first = regular[0].mon;
		const last = regular[regular.length - 1].mon;
		phases.push({ label: "Regular season", date: first === last ? first : `${first} – ${last}`, accent: BRAND, isFinal: false, matches: regular });
	}
	for (const key of STAGE_ORDER) {
		const ms = sorted.filter((m) => m.stage === key);
		if (!ms.length) continue;
		phases.push({ label: STAGES[key].phase, date: `${Number(ms[0].day)} ${ms[0].mon}`, accent: key === "F" ? GOLD : BRAND, isFinal: key === "F", matches: ms });
	}
	const open = phases.findIndex((p) => p.matches.some((m) => m.status !== "done"));
	const final = sorted.find((m) => m.stage === "F" && m.status === "done");
	return { phases, current: open === -1 ? phases.length : open, champion: final ? winnerOf(final) : "" };
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

function LightCrest({ logo, abbr, alt }: { logo: string | null; abbr: string; alt: string }) {
	if (logo) return <img src={logo} alt={alt} loading="lazy" className="h-10 w-10 flex-shrink-0 rounded-full border border-black/10 bg-white object-cover" />;
	return (
		<span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold text-muted" style={{ background: CREST_BG }}>
			{abbr}
		</span>
	);
}

function DarkCrest({ logo, abbr, alt, ring, color }: { logo: string | null; abbr: string; alt: string; ring: string; color: string }) {
	if (logo) return <img src={logo} alt={alt} loading="lazy" className="h-12 w-12 flex-shrink-0 rounded-full bg-white object-cover" style={{ boxShadow: `0 0 0 2px ${ring}` }} />;
	return (
		<span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full font-display text-[15px]" style={{ background: DARK_CREST_BG, boxShadow: `0 0 0 1.5px ${ring}`, color }}>
			{abbr}
		</span>
	);
}

/** Fixtures — season selector, competition cards, season-path strip,
 *  Upcoming/Results toggle, conference filter, match-day list (knockout games
 *  get escalating playoff cards) and a "Roads to Finals" bracket. React
 *  island; filters live in a Zustand store and matches arrive pre-formatted. */
export default function FixtureBoard({ matches, competitions, defaultLeagueSeasonId, competitionSettings, settings, liveBadge }: Props) {
	const { leagueSeasonId, seasonId, conferenceId, view, setLeagueSeason, setSeason, setConference, setView } = useFixturesStore();
	const storedLeague = settings.leagueFilter ? competitions.find((item) => item.id === leagueSeasonId) : undefined;
	const configuredDefaultId = configuredDefaultCompetitionId(competitions, competitionSettings, defaultLeagueSeasonId);
	const defaultCompetition = competitions.find((item) => item.id === configuredDefaultId) ?? competitions[0];
	// Fixtures opens on "All leagues"; a single league is only preselected when
	// the All option is switched off in the competition settings.
	const selectedLeague = storedLeague ?? (
		settings.leagueFilter && !competitionSettings.allLabel ? defaultCompetition : undefined
	);
	const isOverall = !settings.leagueFilter || (Boolean(competitionSettings.allLabel) && !selectedLeague);
	useEffect(() => {
		if (competitionSettings.defaultLeague !== "Remember last choice") return;
		const remembered = window.localStorage.getItem("eb-public-league-season");
		if (remembered && competitions.some((item) => item.id === remembered)) setLeagueSeason(remembered);
	}, []);
	// Remember "All leagues" too (stored as "all"), so picking it sticks.
	const rememberReady = useRef(false);
	useEffect(() => {
		if (!rememberReady.current) { rememberReady.current = true; return; }
		if (competitionSettings.defaultLeague === "Remember last choice") window.localStorage.setItem("eb-public-league-season", leagueSeasonId || "all");
	}, [leagueSeasonId, competitionSettings.defaultLeague]);
	const seasonIds = [...new Set(competitions.map((item) => item.seasonId))];
	const activeSeasonId = seasonId || selectedLeague?.seasonId || defaultCompetition?.seasonId;
	const seasonCompetitions = competitions.filter((item) => item.seasonId === activeSeasonId);
	const selected = selectedLeague ?? seasonCompetitions[0] ?? defaultCompetition;
	const scopeCompetitions = isOverall ? seasonCompetitions : selected ? [selected] : [];
	const scopeIds = new Set(scopeCompetitions.map((item) => item.id));
	const showConferences = !isOverall && selected?.structure === "CONFERENCES" && selected.conferences.length > 0;
	const activeConferenceId = showConferences && selected.conferences.some((item) => item.id === conferenceId) ? conferenceId : "";
	const conferenceName = new Map(competitions.flatMap((c) => c.conferences.map((conf) => [conf.id, conf.name] as const)));

	const shortSeason = (label: string) => {
		let out = label;
		if (competitionSettings.seasonLabel) out = out.replace(new RegExp(`\\s+${competitionSettings.seasonLabel}$`, "i"), "");
		return out.replace(/\s+season$/i, "").trim();
	};
	const seasonLabel = selected?.seasonLabel ?? "";
	const heroSeason = shortSeason(seasonLabel);
	const allCompleted = scopeCompetitions.length > 0 && scopeCompetitions.every((c) => c.status === "COMPLETED");
	const allRegistration = scopeCompetitions.length > 0 && scopeCompetitions.every((c) => c.status === "REGISTRATION");

	// A finished competition opens on its results.
	useEffect(() => {
		if (settings.viewTabs && allCompleted) setView("results");
	}, [selected?.id, isOverall]);

	const isResults = settings.viewTabs && view === "results";
	const now = Date.now();
	const horizonEnd = now + settings.horizon * 24 * 60 * 60 * 1000;
	const inScope = matches
		.filter((m) => scopeIds.has(m.leagueSeasonId ?? ""))
		.filter((m) => !activeConferenceId || m.conferenceIds.includes(activeConferenceId));
	const filtered = inScope
		.filter((m) => (isResults ? m.status === "done" : m.status !== "done"))
		.filter((m) => isResults || m.status === "live" || (m.ts >= now && m.ts <= horizonEnd))
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
	// Upcoming lists every scheduled match day; Results pages one day at a time.
	const pageByDay = settings.dayNav && isResults;
	const displayedGroups = pageByDay ? groups.slice(safeDayIndex, safeDayIndex + 1) : groups;
	const currentGroup = groups[safeDayIndex];

	const scopeName = isOverall ? competitionSettings.allLabel || "All competitions" : selected ? codeOf(selected) : "";
	const compLabel = `${heroSeason} ${scopeName}`.trim();

	// Season-path strip
	const competitionPath = (c: PublicCompetitionOption) => phasesOf(matches.filter((m) => m.leagueSeasonId === c.id));
	const selectedPath = !isOverall && selected ? competitionPath(selected) : null;
	const pathSummary = (c: PublicCompetitionOption) => {
		const p = competitionPath(c);
		if (p.champion) return `${codeOf(c)} champions: ${p.champion}`;
		const phase = p.phases[p.current];
		return `${codeOf(c)}: ${phase ? phase.label : STATUS_LABEL[c.status ?? ""] ?? "Scheduled"}`;
	};
	const strip = isOverall
		? {
			kicker: `${seasonLabel} · All competitions`,
			title: `${heroSeason} · ${competitionSettings.allLabel || "All leagues"}`,
			meta: seasonCompetitions.map(pathSummary).join("  ·  "),
		}
		: selected && selectedPath
			? {
				kicker: `${seasonLabel} · ${selected.leagueLabel}`,
				title: `${heroSeason} ${codeOf(selected)}`,
				meta: selectedPath.champion
					? `Champions · ${selectedPath.champion}`
					: [selectedPath.phases[selectedPath.current] ? `Now: ${selectedPath.phases[selectedPath.current].label}` : STATUS_LABEL[selected.status ?? ""], selected.dateRange].filter(Boolean).join(" · "),
			}
			: null;

	// Roads to Finals — one bracket per competition in scope that has
	// quarterfinal games, independent of the Upcoming/Results toggle and the
	// fixtures horizon. QF → SF → Final are always drawn; rounds not yet
	// scheduled are padded with TBD slots. A legacy generic "Playoff" round only
	// appears when it has games.
	const MIN_SLOTS: Record<PlayoffStage, number> = { PO: 0, QF: 4, SF: 2, F: 1 };
	const brackets = scopeCompetitions.flatMap((c) => {
		const pm = inScope.filter((m) => m.leagueSeasonId === c.id && m.stage).sort((a, b) => a.ts - b.ts);
		if (!pm.some((m) => m.stage === "QF")) return [];
		const rounds = STAGE_ORDER.filter((k) => k !== "PO" || pm.some((m) => m.stage === k)).map((k) => {
			const ms = pm.filter((m) => m.stage === k);
			return {
				key: k,
				st: STAGES[k],
				date: ms.length ? `${ms[0].weekday.slice(0, 3)} ${Number(ms[0].day)} ${ms[0].mon}` : "TBD",
				matches: ms,
				placeholders: Math.max(0, MIN_SLOTS[k] - ms.length),
			};
		});
		const final = pm.find((m) => m.stage === "F" && m.status === "done");
		return [{ c, rounds, champion: final ? winnerOf(final) : "" }];
	});

	const emptyTitle = allRegistration
		? `${heroSeason} schedule coming soon`
		: isResults ? "No results yet" : allCompleted ? "Season complete" : settings.emptyTitle;
	const emptyBody = allRegistration
		? `Team registration is open. Fixtures appear here once the ${heroSeason} schedule is published.`
		: isResults
			? `Completed ${scopeName} matches will appear here once games are played.`
			: allCompleted
				? `The ${heroSeason} season has finished — switch to Results to relive it.`
				: selectedLeague && !isOverall ? fixturesToken(settings.emptyBodyFiltered, selectedLeague.leagueCode || selectedLeague.leagueLabel) : settings.emptyBody;

	// Competition cards — scope everything to one LeagueSeason (or all of them).
	const cards = settings.leagueFilter && selected ? [
		...(competitionSettings.allLabel ? [{
			id: "", code: "ALL", kicker: `${seasonCompetitions.length} competitions`, name: competitionSettings.allLabel, active: isOverall,
			onClick: () => setLeagueSeason(""),
		}] : []),
		...seasonCompetitions.map((c) => ({
			id: c.id, code: codeOf(c), kicker: STATUS_LABEL[c.status ?? ""] ?? c.seasonLabel, name: c.leagueLabel, active: !isOverall && selectedLeague?.id === c.id,
			onClick: () => {
				setSeason(c.seasonId);
				setLeagueSeason(c.id);
				if (settings.viewTabs && c.status === "COMPLETED") setView("results");
			},
		})),
	] : [];
	const cardCols = competitionSettings.allLabel && cards.length > 1
		? `0.8fr repeat(${cards.length - 1},minmax(0,1fr))`
		: `repeat(${Math.max(1, cards.length)},minmax(0,1fr))`;

	const earlier = isResults ? "Newer" : "Earlier";
	const later = isResults ? "Older" : "Later";

	return (
		<>
			{/* HERO: Season → Competition */}
			<section className="relative overflow-hidden border-b border-black/[0.08]">
				<div className="absolute inset-0" style={{ background: "radial-gradient(120% 80% at 82% -10%,rgb(var(--site-brand-rgb) / 0.12),transparent 58%)" }} />
				<div className="absolute -top-20 right-[-140px] h-[520px] w-[520px] rounded-full border border-brand/[0.14]" />
				<div className="relative mx-auto max-w-[1280px] px-8 pb-10 pt-[52px] max-[960px]:px-6">
					<div className="flex flex-wrap items-end justify-between gap-6">
						<div>
							<div className="mb-[18px] inline-flex items-center gap-[10px] font-mono text-[12px] uppercase tracking-[0.14em] text-brand">
								<span className="h-px w-[26px] bg-brand" />{fixturesToken(settings.eyebrow, heroSeason)}
							</div>
							<h1 className="font-display text-[clamp(56px,8vw,120px)] uppercase leading-[0.86] tracking-[0.01em] text-ink">{settings.title}</h1>
						</div>
						{seasonIds.length > 0 && selected && (
							<div className="flex flex-col gap-1.5">
								<span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted2">Season</span>
								<div className="relative">
									<select
										value={activeSeasonId}
										aria-label="Season"
										onChange={(e) => {
											setSeason(e.target.value);
											if (isOverall) return;
											const next = competitions.find((item) => item.seasonId === e.target.value);
											if (next) {
												setSeason(next.seasonId);
												setLeagueSeason(next.id);
											}
										}}
										className="cursor-pointer appearance-none rounded-md border border-black/15 bg-white py-[11px] pl-4 pr-[38px] font-body text-[13px] font-bold tracking-[0.04em] text-ink2 outline-none"
									>
										{seasonIds.map((id) => (
											<option key={id} value={id}>
												{competitions.find((item) => item.seasonId === id)?.seasonLabel}
											</option>
										))}
									</select>
									<span className="pointer-events-none absolute right-[14px] top-1/2 -translate-y-1/2 text-[9px] text-muted">▼</span>
								</div>
							</div>
						)}
					</div>

					{cards.length > 0 && (
						<div className="mt-8 grid grid-cols-1 gap-3 min-[901px]:[grid-template-columns:var(--cols)]" style={{ "--cols": cardCols } as CSSProperties}>
							{cards.map((c) => (
								<button
									key={c.id || "all"}
									type="button"
									onClick={c.onClick}
									aria-pressed={c.active}
									className={`flex cursor-pointer items-center gap-4 rounded-xl px-5 py-4 text-left ${c.active ? "border border-night bg-night shadow-[0_10px_28px_rgba(12,11,10,0.18)]" : "border border-black/[0.12] bg-white hover:border-brand/40"}`}
								>
									<span className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full font-display text-[15px] ${c.active ? "bg-brand text-brandfg" : "bg-panel text-muted"}`}>{c.code}</span>
									<span className="flex min-w-0 flex-col gap-1">
										<span className={`font-mono text-[10px] uppercase tracking-[0.12em] ${c.active ? "text-brandsoft" : "text-muted2"}`}>{c.kicker}</span>
										<span className={`font-display text-[20px] uppercase leading-[1.05] ${c.active ? "text-cream" : "text-ink2"}`}>{c.name}</span>
									</span>
								</button>
							))}
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

			{/* LEAGUE-SEASON STRIP: dates + phase path */}
			{strip && (
				<section className="relative overflow-hidden bg-night text-cream">
					<div className="absolute inset-0" style={{ background: `radial-gradient(60% 160% at 0% 0%,${brandA(0.18)},transparent 60%)` }} />
					<div className="relative mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-x-10 gap-y-6 px-8 py-6 max-[960px]:px-6">
						<div className="flex flex-col gap-1.5">
							<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-brandsoft">{strip.kicker}</span>
							<span className="font-display text-[26px] uppercase leading-none">{strip.title}</span>
							{strip.meta && <span className="font-mono text-[11px] text-creamdim">{strip.meta}</span>}
						</div>
						{selectedPath && selectedPath.phases.length > 0 && (
							<ol className="flex flex-wrap items-center gap-2">
								{selectedPath.phases.map((p, i, arr) => {
									const done = i < selectedPath.current;
									const cur = i === selectedPath.current;
									return (
										<li key={p.label} className="flex items-center gap-2">
											<span
												className="flex items-center gap-2.5 rounded-lg px-3.5 py-2.5"
												style={cur ? { background: "rgba(255,255,255,0.06)", boxShadow: `inset 0 0 0 1px ${p.accent}` } : { background: "transparent", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)" }}
											>
												<span className="inline-block h-2 w-2 rotate-45" style={{ background: done || cur ? p.accent : "transparent", boxShadow: `inset 0 0 0 1.5px ${done || cur ? p.accent : "#4a443d"}` }} />
												<span className="flex flex-col">
													<span className="font-body text-[12px] font-bold uppercase tracking-[0.04em]" style={{ color: cur ? "#f3efe9" : done ? "#b8afa6" : p.isFinal ? GOLD : DIM }}>{p.label}</span>
													<span className="font-mono text-[10px] text-muted2">{p.date}</span>
												</span>
											</span>
											{i < arr.length - 1 && <span className="font-mono text-[12px] text-[#4a443d]">→</span>}
										</li>
									);
								})}
							</ol>
						)}
					</div>
				</section>
			)}

			{/* CONTROLS */}
			{(settings.viewTabs || showConferences) && (
				<section className="border-b border-black/[0.08] bg-panel">
					<div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4 px-8 py-4 max-[960px]:px-6">
						{settings.viewTabs ? <div className="inline-flex rounded-lg border border-black/[0.12] bg-white p-1">
							<button type="button" onClick={() => setView("upcoming")} className={segClass(!isResults)}>Upcoming</button>
							<button type="button" onClick={() => setView("results")} className={segClass(isResults)}>Results</button>
						</div> : <span />}
						{showConferences && (
							<div className="flex flex-wrap items-center gap-2">
								<span className="mr-1 font-mono text-[11px] uppercase tracking-[0.1em] text-muted2">Conference</span>
								<button type="button" onClick={() => setConference("")} className={pillClass(!activeConferenceId)}>All</button>
								{selected.conferences.map((item) => <button key={item.id} type="button" onClick={() => setConference(item.id)} className={pillClass(activeConferenceId === item.id)}>{item.name}</button>)}
							</div>
						)}
					</div>
				</section>
			)}

			{/* LIST */}
			<section className="mx-auto max-w-[1000px] px-8 py-[44px] max-[960px]:px-6 max-[960px]:py-9">
				{groups.length > 0 ? (
					<>
						{pageByDay && groups.length > 1 && currentGroup && (
							<div className="mb-7 flex items-center justify-between gap-4 rounded-xl border border-black/10 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(20,16,9,0.04)]">
								<button type="button" disabled={safeDayIndex === 0} onClick={() => setDayIndex((index) => Math.max(0, index - 1))} className={navClass(safeDayIndex > 0)}>← {earlier}</button>
								<div className="text-center">
									<div className="font-display text-[16px] uppercase leading-none text-ink">
										{currentGroup.weekday.slice(0, 3)} · {Number(currentGroup.day)} {currentGroup.mon} {currentGroup.year}
									</div>
									<div className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted2">Matchday {safeDayIndex + 1} of {groups.length}</div>
								</div>
								<button type="button" disabled={safeDayIndex >= groups.length - 1} onClick={() => setDayIndex((index) => Math.min(groups.length - 1, index + 1))} className={navClass(safeDayIndex < groups.length - 1)}>{later} →</button>
							</div>
						)}
						<div className="flex flex-col gap-9">
							{displayedGroups.map((g) => {
								const topKey = (["F", "SF", "QF", "PO"] as PlayoffStage[]).find((k) => g.matches.some((m) => m.stage === k));
								const top = topKey ? STAGES[topKey] : null;
								return (
									<div key={g.isoDate}>
										<div className="mb-4 flex items-center gap-4">
											<div className="flex flex-col items-center justify-center rounded-lg bg-night px-3.5 py-2 text-center">
												<span className="font-display text-[22px] leading-none text-brand">{g.day}</span>
												<span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted2">{g.mon}</span>
											</div>
											<div>
												<div className="font-display text-[20px] uppercase leading-none text-ink">{g.weekday}</div>
												<div className="mt-1 font-mono text-[11px] uppercase tracking-[0.06em] text-muted2">
													{g.matches.length} {g.matches.length === 1 ? "match" : "matches"} · {compLabel || g.year}
												</div>
											</div>
											<span className="ml-auto h-px flex-1 bg-black/[0.08] max-[600px]:hidden" />
											<span
												className="rounded px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em]"
												style={top ? { background: "#0c0b0a", color: top.accent, boxShadow: `inset 0 0 0 1px ${top.soft}` } : { background: "var(--panel,#efece5)", color: "var(--muted,#6f665c)" }}
											>
												{top ? top.label : "Regular season"}
											</span>
										</div>

										<div className="flex flex-col gap-3">
											{g.matches.map((m) => {
												const st = stageOf(m);
												const competition = competitions.find((c) => c.id === m.leagueSeasonId);
												const code = competition ? codeOf(competition) : m.leagueCode || m.league;
												return st
													? <PlayoffCard key={m.id} m={m} st={st} code={code} season={competition ? shortSeason(competition.seasonLabel) : heroSeason} settings={settings} liveBadge={liveBadge} />
													: <RegularCard key={m.id} m={m} code={code} conferenceName={conferenceName} settings={settings} liveBadge={liveBadge} />;
											})}
										</div>
									</div>
								);
							})}
						</div>
					</>
				) : (
					<div className="flex flex-col items-center gap-3 rounded-[14px] border border-dashed border-black/[0.16] bg-paper2 px-8 py-20 text-center">
						<div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-panel">
							<div className="relative h-[22px] w-[22px] rounded-full border-2 border-[#b3a99c]">
								<span className="absolute bottom-0 left-1/2 top-0 w-0.5 -translate-x-1/2 bg-[#b3a99c]" />
								<span className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-[#b3a99c]" />
							</div>
						</div>
						<div className="font-display text-[22px] uppercase text-ink">{emptyTitle}</div>
						<p className="max-w-[400px] text-[14px] leading-[1.5] text-muted">{emptyBody}</p>
					</div>
				)}
			</section>

			{/* ROAD TO THE FINAL */}
			{brackets.length > 0 && (
				<section className="relative overflow-hidden bg-night text-cream">
					<div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(60% 90% at 100% 0%,${goldA(0.16)},transparent 60%),radial-gradient(60% 90% at 0% 100%,${brandA(0.2)},transparent 60%)` }} />
					<div className="relative h-[5px]" style={{ background: `linear-gradient(90deg,${BRAND},${BRAND_SOFT} 35%,#e2b04a 70%,#f6dc96)` }} />
					<div className="relative mx-auto max-w-[1280px] px-8 py-14 max-[960px]:px-6">
						<div className="mb-10 flex flex-wrap items-end justify-between gap-4">
							<div>
								<div className="mb-3 inline-flex items-center gap-[10px] font-mono text-[12px] uppercase tracking-[0.14em] text-gold"><span className="h-px w-[26px] bg-gold" />Playoffs</div>
								<h2 className="font-display text-[clamp(40px,6vw,76px)] uppercase leading-[0.9]">Roads to <span className="text-gold">Finals</span></h2>
							</div>
							<span className="font-mono text-[11px] uppercase tracking-[0.1em] text-creamdim">
								Quarterfinals → Semifinals → Final
							</span>
						</div>
						<div className="flex flex-col gap-12">
							{brackets.map((b) => (
								<div key={b.c.id}>
									<div className="mb-5 flex flex-wrap items-center gap-3 border-b border-white/10 pb-4">
										<span className="font-display text-[24px] uppercase leading-none">{shortSeason(b.c.seasonLabel)} {codeOf(b.c)} Playoffs</span>
										<span className="font-mono text-[11px] text-creamdim">{b.c.leagueLabel}</span>
										{b.champion && (
											<span className="ml-auto rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-gold" style={{ boxShadow: `inset 0 0 0 1px ${goldA(0.7)}`, background: goldA(0.08) }}>
												★ {b.champion} · {shortSeason(b.c.seasonLabel)} {codeOf(b.c)} Champions
											</span>
										)}
									</div>
									<div className="overflow-x-auto pb-2">
										<div className="grid min-w-[720px] gap-5" style={{ gridTemplateColumns: `repeat(${b.rounds.length},minmax(0,1fr))` }}>
											{b.rounds.map((r) => (
												<div key={r.key} className="flex flex-col">
													<div className="mb-3 flex items-baseline justify-between gap-2">
														<span className="font-display text-[18px] uppercase leading-none" style={{ color: r.st.accent }}>{r.st.label}</span>
														<span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted2">{r.date}</span>
													</div>
													<div className="flex flex-1 flex-col justify-around gap-3">
														{r.matches.map((m) => {
															const scored = scoredOf(m);
															const rows = [
																{ name: m.home, logo: m.homeLogo, ab: m.homeAbbr, sc: m.homeScore, win: m.homeWin },
																{ name: m.away, logo: m.awayLogo, ab: m.awayAbbr, sc: m.awayScore, win: m.awayWin },
															];
															return (
																<a key={m.id} href={m.href} className="relative block overflow-hidden rounded-lg bg-[#141210] no-underline transition-transform duration-200 hover:-translate-y-0.5" style={r.st.card}>
																	<div className="pointer-events-none absolute inset-0" style={r.st.glow} />
																	<div className="relative" style={r.st.bar} />
																	<div className="relative flex flex-col gap-2 px-3.5 py-3">
																		{rows.map((t, i) => (
																			<div key={i} className="flex items-center gap-2.5">
																				{t.logo
																					? <img src={t.logo} alt="" loading="lazy" className="h-7 w-7 flex-shrink-0 rounded-full bg-white object-cover" />
																					: <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/[0.06] font-mono text-[9px] font-bold text-creamdim">{t.ab}</span>}
																				<span className="min-w-0 flex-1 truncate font-body text-[13px] font-bold" style={{ color: scored && !t.win ? DIM : LIGHT }} title={t.name}>
																					{t.name}
																				</span>
																				<span className="font-display text-[18px] leading-none" style={{ color: t.win ? r.st.accent : DIM }}>{scored ? t.sc : ""}</span>
																			</div>
																		))}
																		<div className="border-t border-white/[0.08] pt-2 font-mono text-[10px] uppercase tracking-[0.08em] text-muted2">
																			{m.status === "done" ? "Final" : m.status === "live" ? liveBadge : m.time}
																		</div>
																	</div>
																</a>
															);
														})}
														{Array.from({ length: r.placeholders }, (_, i) => (
															<div key={`tbd-${i}`} className="relative overflow-hidden rounded-lg border border-dashed border-white/[0.14] bg-white/[0.02]">
																<div className="relative" style={{ ...r.st.bar, opacity: 0.35 }} />
																<div className="flex flex-col gap-2 px-3.5 py-3">
																	{[0, 1].map((row) => (
																		<div key={row} className="flex items-center gap-2.5">
																			<span className="h-7 w-7 flex-shrink-0 rounded-full border border-dashed border-white/[0.16]" />
																			<span className="font-body text-[13px] font-bold text-[#5c554d]">TBD</span>
																		</div>
																	))}
																	<div className="border-t border-white/[0.06] pt-2 font-mono text-[10px] uppercase tracking-[0.08em] text-[#5c554d]">To be decided</div>
																</div>
															</div>
														))}
													</div>
												</div>
											))}
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</section>
			)}
		</>
	);
}

interface CardProps {
	m: FixtureMatch;
	code: string;
	settings: PublicFixturesSettings;
	liveBadge: string;
}

/** Regular-season match card (light). */
function RegularCard({ m, code, conferenceName, settings, liveBadge }: CardProps & { conferenceName: Map<string, string> }) {
	const scored = scoredOf(m);
	const done = m.status === "done";
	const homeColor = scored ? (m.homeWin ? "var(--ink,#141009)" : DIM) : "var(--ink,#1a1712)";
	const awayColor = scored ? (m.awayWin ? "var(--ink,#141009)" : DIM) : "var(--ink,#1a1712)";
	const statusText = done ? "Final" : m.status === "live" ? liveBadge : "Tip-off";
	const confs = m.conferenceIds.map((id) => conferenceName.get(id)).filter(Boolean) as string[];
	const confLabel = confs.length === 1 ? `${confs[0]} Conf` : confs.length === 2 ? `${confs[0]} v ${confs[1]}` : "";
	const venue = settings.venue ? m.venue : null;
	const timeVenue = venue ? `${m.time} · ${venue}` : m.time;
	return (
		<div className="relative rounded-xl border border-black/10 bg-white px-5 py-4 shadow-[0_1px_2px_rgba(20,16,9,0.04)] transition-colors hover:border-brand/40">
			<a href={m.href} aria-label={`${m.home} vs ${m.away} — match details`} className="absolute inset-0 z-[1] rounded-xl" />
			<div className="mb-3 flex items-center justify-between gap-3">
				<div className="flex items-center gap-2">
					{settings.leagueTag && <span className="rounded bg-ink/[0.06] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-muted">{code}</span>}
					{confLabel && <span className="rounded border border-black/10 px-2 py-[3px] font-mono text-[9px] uppercase tracking-[0.1em] text-muted">{confLabel}</span>}
				</div>
				<span className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: done ? DIM : BRAND }}>{statusText}</span>
			</div>
			<div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
				<div className="flex items-center gap-3 justify-self-end text-right max-[600px]:flex-col-reverse max-[600px]:items-end max-[600px]:gap-1.5">
					<span className="font-body text-[15px] font-bold leading-tight max-[600px]:text-[13px]" style={{ color: homeColor }} title={m.home}>{m.home}</span>
					{settings.crests && <LightCrest logo={m.homeLogo} abbr={m.homeAbbr} alt={`${m.home} logo`} />}
				</div>
				<div className="flex min-w-[64px] flex-col items-center">
					<span className={`font-display leading-none text-ink ${scored ? "text-[24px]" : "text-[22px]"}`}>{scored ? m.score : m.time}</span>
				</div>
				<div className="flex items-center gap-3 max-[600px]:flex-col max-[600px]:items-start max-[600px]:gap-1.5">
					{settings.crests && <LightCrest logo={m.awayLogo} abbr={m.awayAbbr} alt={`${m.away} logo`} />}
					<span className="font-body text-[15px] font-bold leading-tight max-[600px]:text-[13px]" style={{ color: awayColor }} title={m.away}>{m.away}</span>
				</div>
			</div>
			<div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-black/[0.06] pt-3">
				<span className="font-mono text-[11px] text-muted2">{scored ? timeVenue : settings.venue ? (m.venue || "Venue TBC") : ""}</span>
				{!scored && settings.ics && (m.homeTeamId || m.awayTeamId) && (
					<span className="relative z-[2] flex items-center gap-1.5">
						<span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted2">Add to calendar</span>
						{m.homeTeamId && <a href={`/api/calendar/teams/${m.homeTeamId}.ics`} download className="rounded border border-black/15 px-2 py-1 font-mono text-[10px] font-bold text-ink2 no-underline hover:border-brand hover:text-brand">{m.homeAbbr}</a>}
						{m.awayTeamId && <a href={`/api/calendar/teams/${m.awayTeamId}.ics`} download className="rounded border border-black/15 px-2 py-1 font-mono text-[10px] font-bold text-ink2 no-underline hover:border-brand hover:text-brand">{m.awayAbbr}</a>}
					</span>
				)}
				{scored && <span className="font-mono text-[11px] text-ink2">Box score →</span>}
			</div>
		</div>
	);
}

/** Knockout match card (dark) — styling escalates by round. */
function PlayoffCard({ m, st, code, season, settings, liveBadge }: CardProps & { st: StageStyle; season: string }) {
	const scored = scoredOf(m);
	const done = m.status === "done";
	const homeDark = scored && !m.homeWin ? DIM : LIGHT;
	const awayDark = scored && !m.awayWin ? DIM : LIGHT;
	const winner = winnerOf(m);
	const tagline = m.stage === "F"
		? (done && winner ? `${winner} · ${season} ${code} Champions` : `Winner lifts the ${season} ${code} title`)
		: (done && winner ? `${winner} advance to the ${st.next}` : `Winner advances to the ${st.next}`);
	const statusText = done ? "Final" : m.status === "live" ? liveBadge : "Upcoming";
	const statusColor = done ? "#b8afa6" : m.stage === "F" ? GOLD : BRAND_SOFT;
	const venue = settings.venue ? m.venue : null;
	return (
		<div className="relative overflow-hidden rounded-xl bg-night text-cream transition-transform duration-200 hover:-translate-y-0.5" style={st.card}>
			<a href={m.href} aria-label={`${m.home} vs ${m.away} — match details`} className="absolute inset-0 z-[1]" />
			<div className="pointer-events-none absolute inset-0" style={st.glow} />
			<div className="pointer-events-none absolute -bottom-7 right-4 select-none font-display text-[150px] uppercase leading-none max-[600px]:text-[90px]" style={st.markStyle}>{st.mark}</div>
			<div className="relative" style={st.bar} />
			<div className="pointer-events-none relative px-6 pb-5 pt-5 max-[600px]:px-4">
				<div className="mb-5 flex flex-wrap items-center justify-between gap-3">
					<div className="flex items-center gap-3">
						<span className="font-display text-[24px] uppercase leading-none tracking-[0.02em]" style={{ color: st.accent }}>{st.round}</span>
						{settings.leagueTag && <span className="rounded border border-white/15 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-creamdim">{code} Playoffs</span>}
					</div>
					<span className="font-mono text-[11px] uppercase tracking-[0.1em]" style={{ color: statusColor }}>{statusText}</span>
				</div>
				<div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 max-[600px]:gap-2">
					<div className="flex items-center gap-3 justify-self-end text-right max-[600px]:flex-col-reverse max-[600px]:items-end max-[600px]:gap-2">
						<span className="font-display text-[19px] uppercase leading-[1.05] max-[600px]:text-[14px]" style={{ color: homeDark }} title={m.home}>{m.home}</span>
						{settings.crests && <DarkCrest logo={m.homeLogo} abbr={m.homeAbbr} alt={`${m.home} logo`} ring={st.soft} color={homeDark} />}
					</div>
					<div className="flex flex-col items-center px-2">
						{scored ? (
							<span className="font-display text-[40px] leading-none max-[600px]:text-[28px]">
								<span style={{ color: homeDark }}>{m.homeScore}</span>
								<span className="mx-2 text-[#4a443d]">–</span>
								<span style={{ color: awayDark }}>{m.awayScore}</span>
							</span>
						) : (
							<span className="font-display text-[28px] leading-none" style={{ color: st.accent }}>VS</span>
						)}
					</div>
					<div className="flex items-center gap-3 max-[600px]:flex-col max-[600px]:items-start max-[600px]:gap-2">
						{settings.crests && <DarkCrest logo={m.awayLogo} abbr={m.awayAbbr} alt={`${m.away} logo`} ring={st.soft} color={awayDark} />}
						<span className="font-display text-[19px] uppercase leading-[1.05] max-[600px]:text-[14px]" style={{ color: awayDark }} title={m.away}>{m.away}</span>
					</div>
				</div>
				<div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
					<span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em]" style={{ color: st.accent }}>
						<span className="inline-block h-1.5 w-1.5 rotate-45" style={{ background: st.accent }} />{tagline}
					</span>
					<span className="font-mono text-[11px] text-creamdim">{venue ? `${m.time} · ${venue}` : m.time}</span>
				</div>
			</div>
		</div>
	);
}
