/**
 * League-detail domain types + rules. Pure — no framework, no I/O.
 * The DTO mirrors `GET /api/leagues/[leagueId]/overview` exactly.
 */
import type { AdminLeague } from "./league";

export interface LeagueSeasonSummary {
	id: string;
	name: string;
	startDate: string;
	endDate: string;
	active: boolean;
	/** Teams entered in this season *of this league* (a season may span leagues). */
	teams: number;
	/** Matches of this league in this season. */
	matches: number;
	completed: number;
}

export interface LeagueTeamSummary {
	id: string;
	name: string;
	slug: string;
	logo: string | null;
	played: number;
	won: number;
	lost: number;
}

export interface LeagueMatchSummary {
	id: string;
	date: string;
	status: string;
	team1: string;
	team2: string;
	team1Score: number | null;
	team2Score: number | null;
}

export interface LeagueStandingRow {
	rank: number;
	teamId: string;
	team: string;
	logo: string | null;
	won: number;
	lost: number;
	points: number;
}

export interface LeagueDetail {
	league: AdminLeague;
	currentSeason: { id: string; name: string } | null;
	/** Completed matches across the whole league (including any with no season). */
	completedMatches: number;
	seasons: LeagueSeasonSummary[];
	teams: LeagueTeamSummary[];
	recentMatches: LeagueMatchSummary[];
	standings: LeagueStandingRow[];
}

export type LeagueTab = "Overview" | "Seasons" | "Teams";
export const LEAGUE_TABS: LeagueTab[] = ["Overview", "Seasons", "Teams"];

export interface LeagueDetailStats {
	seasons: number;
	teams: number;
	matches: number;
	completed: number;
}

/**
 * Match totals come from the league itself, not from summing seasons — a match
 * may have no season, and summing would silently drop it.
 */
export function computeDetailStats(detail: LeagueDetail): LeagueDetailStats {
	return {
		seasons: detail.seasons.length,
		teams: detail.teams.length,
		matches: detail.league._count.matches,
		completed: detail.completedMatches,
	};
}

/** Share of a season's matches already played, 0–100. A season with no fixtures is 0%, never NaN. */
export function seasonProgress(season: Pick<LeagueSeasonSummary, "matches" | "completed">): number {
	if (season.matches <= 0) return 0;
	return Math.round((season.completed / season.matches) * 100);
}

export type SeasonBadge = "Active" | "Upcoming" | "Completed";

/** A season is Upcoming before it starts, Completed after it ends, otherwise Active. */
export function seasonBadge(
	season: Pick<LeagueSeasonSummary, "startDate" | "endDate" | "active">,
	now: Date = new Date(),
): SeasonBadge {
	const start = new Date(season.startDate);
	const end = new Date(season.endDate);
	if (!Number.isNaN(start.getTime()) && now < start) return "Upcoming";
	if (!Number.isNaN(end.getTime()) && now > end) return "Completed";
	return season.active ? "Active" : "Completed";
}
