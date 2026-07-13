/**
 * Season-detail domain types + rules. Pure — no framework, no I/O.
 * The DTO mirrors `GET /api/seasons/[seasonId]/overview` exactly.
 */
import type { AdminSeason } from "./season";

export interface SeasonFixture {
	id: string;
	date: string;
	status: string;
	team1: string;
	team2: string;
	team1Score: number | null;
	team2Score: number | null;
}

export interface SeasonStandingRow {
	rank: number;
	teamId: string;
	team: string;
	logo: string | null;
	won: number;
	lost: number;
	points: number;
}

export interface SeasonTeamSummary {
	id: string;
	name: string;
	slug: string;
	logo: string | null;
	played: number;
	won: number;
	lost: number;
}

export interface SeasonDetail {
	season: AdminSeason;
	fixtures: SeasonFixture[];
	standings: SeasonStandingRow[];
	teams: SeasonTeamSummary[];
}

export type SeasonTab = "Schedule" | "Standings" | "Teams";
export const SEASON_TABS: SeasonTab[] = ["Schedule", "Standings", "Teams"];

export interface SeasonDetailStats {
	matches: number;
	played: number;
	remaining: number;
	teams: number;
}

/**
 * Match totals come from the season's own counts, not from the fixture list —
 * so the rail stays correct even if the fixture list is ever paged.
 * `remaining` is clamped at 0: more played than scheduled would otherwise show
 * a negative count.
 */
export function computeSeasonStats(detail: SeasonDetail): SeasonDetailStats {
	const { matches, completed } = detail.season;
	return {
		matches,
		played: completed,
		remaining: Math.max(0, matches - completed),
		teams: detail.teams.length,
	};
}

export type FixtureResult = "Final" | "Live" | "Upcoming";

/** Mirrors the MatchStatus enum (UPCOMING | LIVE | COMPLETED). */
export function fixtureResult(fixture: Pick<SeasonFixture, "status">): FixtureResult {
	if (fixture.status === "COMPLETED") return "Final";
	if (fixture.status === "LIVE") return "Live";
	return "Upcoming";
}

/**
 * The score chip. A played match shows its scoreline; anything else shows the
 * tip-off time. A completed match with no score recorded shows a dash rather
 * than inventing a 0–0.
 */
export function fixtureScore(fixture: SeasonFixture): string {
	const played = fixtureResult(fixture) !== "Upcoming";
	if (played) {
		const { team1Score: a, team2Score: b } = fixture;
		if (a === null || b === null) return "—";
		return `${a}–${b}`;
	}

	const date = new Date(fixture.date);
	if (Number.isNaN(date.getTime())) return "—";
	return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/** "MON 13" — the compact date column in the fixtures table. */
export function fixtureDay(fixture: Pick<SeasonFixture, "date">): string {
	const date = new Date(fixture.date);
	if (Number.isNaN(date.getTime())) return "—";
	const weekday = date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
	return `${weekday} ${date.getDate()}`;
}
