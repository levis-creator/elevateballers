/**
 * v2 Match-detail entities. `MatchView` is a fully display-ready view model —
 * the datasource resolves every state (upcoming / live / final), derives stats
 * from match events, and formats dates in the league timezone, so the React
 * island only picks tabs and renders.
 */

export type MatchState = "upcoming" | "live" | "final";

/** One team on the scoreboard. */
export interface MatchSide {
	name: string;
	nickname?: string | null;
	abbr: string;
	logo: string | null;
	href: string;
	/** Scoreboard name/score colour (winner bright, loser dimmed, pre-game bright). */
	color: string;
	/** e.g. "5W · 2L", or null when unknown. */
	record: string | null;
	/** Final/live score, or null before tip-off. */
	score: number | null;
}

/** A team's per-quarter line in the scoring table. */
export interface QuarterRow {
	name: string;
	nickname?: string | null;
	abbr: string;
	color: string;
	/** Points per period, aligned to `periodLabels`. */
	scores: number[];
	total: number;
}

export interface PerformerCard {
	name: string;
	team: string;
	image: string | null;
	pts: number;
	reb: number;
	ast: number;
}

/** One row in the team-stats comparison (bars are % of the larger side). */
export interface ComparisonRow {
	label: string;
	homeVal: string;
	awayVal: string;
	homeColor: string;
	awayColor: string;
	homePct: number;
	awayPct: number;
}

export interface BoxRow {
	num: string;
	name: string;
	starter: boolean;
	min: string;
	pts: number;
	reb: number;
	ast: number;
	stl: number;
	tp: number;
	/** Blocks / personal fouls — surfaced in the admin box score. */
	blk: number;
	pf: number;
}

/** One play-by-play entry with the running score after it. */
export interface PbpEvent {
	t: string;
	text: string;
	score: string;
	side: "home" | "away" | "neutral";
	/** Short category chip label, e.g. "2PT" / "REB" / "FOUL" (admin play-by-play). */
	cat: string;
}

/** Filter bucket for the admin match timeline (ALL is every bucket). */
export type TimelineKind = "scoring" | "subs" | "fouls";

/** One entry in the admin match timeline (subs, fouls, quarter markers, runs, final). */
export interface TimelineEvent {
	/** Short chip label: SUB / FOUL / QTR / RUN / FINAL. */
	chip: string;
	kind: TimelineKind;
	/** Dot + chip accent colour (hex). */
	color: string;
	title: string;
	/** Team name / score summary shown after the title, or null. */
	team: string | null;
	detail: string;
	/** e.g. "Q2 06:20". */
	t: string;
}

/** Pre-game last-5 form for a team. */
export interface FormGuide {
	team: string;
	nickname?: string | null;
	abbr: string;
	logo: string | null;
	chips: Array<"W" | "L" | "D">;
}

/** Pre-game head-to-head history row. */
export interface H2HRow {
	dateText: string;
	home: string;
	away: string;
	score: string;
	winner: string | null;
}

export interface WatchCard {
	name: string;
	team: string;
	image: string | null;
	line: string;
}

export interface MatchView {
	id: string;
	/** Canonical slug, or null — the route 301s the cuid URL to this. */
	slug: string | null;
	state: MatchState;
	/** score exists once the game tips off (live or final). */
	hasScore: boolean;
	/** quarters / box / play-by-play shown for live + final. */
	showStats: boolean;

	league: string;
	scoreboardTag: string;
	backHref: string;
	backLabel: string;
	dateText: string;
	time: string;
	venue: string | null;
	/** e.g. "LIVE · Q4 02:26", or null when not live. */
	liveTag: string | null;

	home: MatchSide;
	away: MatchSide;

	// --- live / final ---
	periodLabels: string[]; // ["Q1","Q2",…] or ["Q1"..,"OT"]
	quarters: QuarterRow[];
	performers: PerformerCard[];
	comparison: ComparisonRow[];
	box: { home: BoxRow[]; away: BoxRow[] };
	pbpPeriods: string[]; // period keys present, e.g. ["Q1","Q2",…]
	pbpByPeriod: Record<string, PbpEvent[]>;
	/** Narrative match timeline: subs, fouls, quarter/half/final markers, runs. */
	timeline: TimelineEvent[];

	// --- upcoming ---
	formGuide: FormGuide[];
	h2h: H2HRow[];
	watch: WatchCard[];
}
