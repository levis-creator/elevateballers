/**
 * Season domain types + rules. Pure — no framework, no I/O, so every rule below
 * is unit-testable on its own.
 *
 * This module is the single source of truth for a season's status. The leagues
 * feature renders the same badge on its detail page and delegates here, so the
 * two screens can never disagree about whether a season is Live.
 */

export interface AdminSeasonLeague {
	id: string;
	name: string;
}

export interface AdminSeason {
	id: string;
	name: string;
	slug: string;
	description: string | null;
	startDate: string;
	endDate: string;
	active: boolean;
	bracketType: string | null;
	/** A season may run in several leagues (many-to-many), or in none. */
	leagues: AdminSeasonLeague[];
	matches: number;
	completed: number;
	/** Regular season or the knockout round in play; null when unknown or no matches. */
	stage?: SeasonStage | null;
}

/** The shape any status rule needs — so both features can pass their own DTO. */
export type SeasonTiming = Pick<AdminSeason, "startDate" | "endDate" | "active">;
export type SeasonTally = Pick<AdminSeason, "matches" | "completed">;

export type SeasonStatus = "Live" | "Upcoming" | "Completed";

export class ActiveSeasonConflictError extends Error {
	constructor() {
		super("Only one active season is allowed. Complete the current active season before activating another.");
		this.name = "ActiveSeasonConflictError";
	}
}

/** Enforces the product invariant that at most one season is active. */
export function assertSingleActiveSeason(activeSeasonCount: number, activating: boolean): void {
	if (activating && activeSeasonCount > 0) {
		throw new ActiveSeasonConflictError();
	}
}

/**
 * The dates decide the lifecycle; `active` is the admin's override for ending a
 * season early ("Mark completed"). There is no status column, so:
 *
 *   before it starts  → Upcoming
 *   after it ends     → Completed
 *   otherwise         → Live, unless it has been marked completed
 *
 * An unparseable bound is ignored rather than trusted.
 */
export function seasonStatus(season: SeasonTiming, now: Date = new Date()): SeasonStatus {
	const start = new Date(season.startDate);
	const end = new Date(season.endDate);

	if (!Number.isNaN(start.getTime()) && now < start) return "Upcoming";
	if (!Number.isNaN(end.getTime()) && now > end) return "Completed";
	return season.active ? "Live" : "Completed";
}

/** Share of a season's matches already played, 0–100. No fixtures is 0%, never NaN. */
export function seasonProgress(season: SeasonTally): number {
	if (season.matches <= 0) return 0;
	return Math.round((season.completed / season.matches) * 100);
}

/** Matches of one season bucketed by stage and status, as a `groupBy` returns them. */
export interface SeasonStageTally {
	stage: string | null;
	status: string;
	count: number;
}

export type SeasonStage =
	| "Regular season"
	| "Regular season complete"
	| "Playoffs"
	| "Quarterfinals"
	| "Semifinals"
	| "Final"
	| "Season complete";

// Knockout rounds in the order they are played. A generated bracket creates
// every round up front with TBD teams, so later rounds exist before they start.
const PLAYOFF_ROUNDS: ReadonlyArray<readonly [string, SeasonStage]> = [
	["PLAYOFF", "Playoffs"],
	["QUARTER_FINALS", "Quarterfinals"],
	["SEMI_FINALS", "Semifinals"],
	["CHAMPIONSHIP", "Final"],
];
const isRegular = (stage: string | null) => stage === null || stage === "REGULAR_SEASON";
const isPlayoff = (stage: string | null) => PLAYOFF_ROUNDS.some(([round]) => round === stage);

/**
 * Where a season is: the regular season while any of its games are unplayed,
 * then the earliest knockout round with a game still to play. Preseason,
 * exhibition and other one-off games never decide the stage. No matches → null.
 */
export function seasonStage(tallies: SeasonStageTally[]): SeasonStage | null {
	const rows = tallies.filter((row) => row.count > 0);
	if (!rows.length) return null;
	const open = (match: (stage: string | null) => boolean) =>
		rows.some((row) => match(row.stage) && row.status !== "COMPLETED");

	if (open(isRegular)) return "Regular season";
	if (!rows.some((row) => isPlayoff(row.stage))) {
		return rows.some((row) => isRegular(row.stage)) ? "Regular season complete" : null;
	}
	const current = PLAYOFF_ROUNDS.find(([round]) => open((stage) => stage === round));
	return current ? current[1] : "Season complete";
}

/** Games per knockout tie by round, from the Fixtures "Playoff format" setting. */
export interface SeriesFormat {
	QF: number;
	SF: number;
	F: number;
}

/** One knockout game, enough to tell which series it belongs to and who won it. */
export interface KnockoutGame {
	stage: string | null;
	status: string;
	team1Id: string | null;
	team2Id: string | null;
	team1Score: number | null;
	team2Score: number | null;
	winnerId: string | null;
}

const SERIES_ROUNDS: Record<string, keyof SeriesFormat> = {
	QUARTER_FINALS: "QF",
	SEMI_FINALS: "SF",
	CHAMPIONSHIP: "F",
};
/** The stages played as series; fetch these games for `seriesAwareProgress`. */
export const SERIES_STAGES = Object.keys(SERIES_ROUNDS) as ("QUARTER_FINALS" | "SEMI_FINALS" | "CHAMPIONSHIP")[];

function gameWinner(game: KnockoutGame): string | null {
	if (game.status !== "COMPLETED") return null;
	if (game.winnerId) return game.winnerId;
	if (game.team1Score == null || game.team2Score == null || game.team1Score === game.team2Score) return null;
	return game.team1Score > game.team2Score ? game.team1Id : game.team2Id;
}

/**
 * Unplayed games in series that are already decided — game 3 of a quarterfinal
 * won 2–0 — as tallies. Games are grouped into a series by round and the two
 * teams; a game with a team still TBD is never part of a decided series.
 */
export function decidedSeriesLeftovers(games: KnockoutGame[], format: SeriesFormat): SeasonStageTally[] {
	const series = new Map<string, KnockoutGame[]>();
	for (const game of games) {
		if (!game.stage || !SERIES_ROUNDS[game.stage] || !game.team1Id || !game.team2Id) continue;
		const key = `${game.stage}|${[game.team1Id, game.team2Id].sort().join("|")}`;
		series.set(key, [...(series.get(key) ?? []), game]);
	}

	const leftovers = new Map<string, SeasonStageTally>();
	for (const ties of series.values()) {
		const needed = Math.floor(format[SERIES_ROUNDS[ties[0].stage!]] / 2) + 1;
		const wins = new Map<string, number>();
		for (const game of ties) {
			const winner = gameWinner(game);
			if (winner) wins.set(winner, (wins.get(winner) ?? 0) + 1);
		}
		if (![...wins.values()].some((count) => count >= needed)) continue;
		for (const game of ties) {
			if (game.status === "COMPLETED") continue;
			const key = `${game.stage}|${game.status}`;
			const row = leftovers.get(key) ?? { stage: game.stage, status: game.status, count: 0 };
			row.count += 1;
			leftovers.set(key, row);
		}
	}
	return [...leftovers.values()];
}

/**
 * Progress and stage with knockout rounds counted as series: once a team has
 * the wins its round needs, that series' unplayed games no longer count toward
 * the total and no longer hold the season in that round.
 */
export function seriesAwareProgress(
	tallies: SeasonStageTally[],
	knockoutGames: KnockoutGame[],
	format: SeriesFormat
): { matches: number; completed: number; stage: SeasonStage | null } {
	const leftovers = decidedSeriesLeftovers(knockoutGames, format);
	const counted = tallies.map((row) => {
		const surplus = leftovers.find((left) => left.stage === row.stage && left.status === row.status);
		return surplus ? { ...row, count: Math.max(0, row.count - surplus.count) } : row;
	});
	return {
		matches: counted.reduce((sum, row) => sum + row.count, 0),
		completed: counted.filter((row) => row.status === "COMPLETED").reduce((sum, row) => sum + row.count, 0),
		stage: seasonStage(counted),
	};
}

export type SeasonFilter = "All" | "Live" | "Upcoming" | "Completed";
export const SEASON_FILTERS: SeasonFilter[] = ["All", "Live", "Upcoming", "Completed"];

export function matchesFilter(season: AdminSeason, filter: SeasonFilter, now: Date = new Date()): boolean {
	if (filter === "All") return true;
	return seasonStatus(season, now) === filter;
}

/** Searches the season's own text and the names of the leagues it runs in. */
export function matchesSearch(season: AdminSeason, query: string): boolean {
	const q = query.trim().toLowerCase();
	if (!q) return true;

	const leagues = season.leagues.map((l) => l.name).join(" ");
	return `${season.name} ${season.description ?? ""} ${leagues}`.toLowerCase().includes(q);
}

export interface SeasonStats {
	total: number;
	live: number;
	upcoming: number;
	matches: number;
}

export function computeStats(seasons: AdminSeason[], now: Date = new Date()): SeasonStats {
	let live = 0;
	let upcoming = 0;
	let matches = 0;

	for (const season of seasons) {
		const status = seasonStatus(season, now);
		if (status === "Live") live++;
		if (status === "Upcoming") upcoming++;
		matches += season.matches;
	}

	return { total: seasons.length, live, upcoming, matches };
}

export function countByFilter(seasons: AdminSeason[], now: Date = new Date()): Record<SeasonFilter, number> {
	const counts: Record<SeasonFilter, number> = { All: seasons.length, Live: 0, Upcoming: 0, Completed: 0 };
	for (const season of seasons) counts[seasonStatus(season, now)]++;
	return counts;
}

const DATE_FORMAT: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" };

function formatDate(value: string): string {
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-US", DATE_FORMAT);
}

/** "Jan 1, 2026 – Dec 31, 2026". An unparseable bound shows as "—" rather than "Invalid Date". */
export function formatRange(startDate: string, endDate: string): string {
	return `${formatDate(startDate)} – ${formatDate(endDate)}`;
}
