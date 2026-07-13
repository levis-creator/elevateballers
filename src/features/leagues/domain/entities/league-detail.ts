/**
 * League-detail domain types + rules. Pure — no framework, no I/O.
 * The DTO mirrors `GET /api/leagues/[leagueId]/overview` exactly.
 */
import type { AdminLeague } from "./league";

// A season's status and progress are the seasons feature's rules, not the
// leagues feature's. Re-exported here so this page's components keep one import,
// but there is a single implementation — the badge can't disagree between the
// league detail page and the seasons board.
export { seasonProgress, seasonStatus, type SeasonStatus } from "@/features/seasons/domain/entities/season";

export interface LeagueSeasonSummary {
	id: string;
	name: string;
	startDate: string;
	endDate: string;
	active: boolean;
	bracketType: string | null;
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

