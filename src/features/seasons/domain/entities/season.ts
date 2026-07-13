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
}

/** The shape any status rule needs — so both features can pass their own DTO. */
export type SeasonTiming = Pick<AdminSeason, "startDate" | "endDate" | "active">;
export type SeasonTally = Pick<AdminSeason, "matches" | "completed">;

export type SeasonStatus = "Live" | "Upcoming" | "Completed";

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
