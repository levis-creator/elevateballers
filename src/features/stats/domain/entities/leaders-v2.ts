/**
 * v2 Stat-Leaders entities. A `LeaderRow` is one player's per-game averages
 * within a single (season, league) bucket — the island filters by stat + league
 * + season and sorts, so no stat logic lives on the client.
 */

export type StatKey = "Points" | "Rebounds" | "Assists" | "Steals" | "Blocks" | "3-Pointers";

export interface StatMeta {
	key: StatKey;
	/** Section heading, e.g. "Points". */
	label: string;
	/** Column/tag unit, e.g. "PPG". */
	unit: string;
}

/** Category order shown in the selector, matching the design. */
export const STAT_METAS: StatMeta[] = [
	{ key: "Points", label: "Points", unit: "PPG" },
	{ key: "Rebounds", label: "Rebounds", unit: "RPG" },
	{ key: "Assists", label: "Assists", unit: "APG" },
	{ key: "Steals", label: "Steals", unit: "SPG" },
	{ key: "Blocks", label: "Blocks", unit: "BPG" },
	{ key: "3-Pointers", label: "3-Pointers", unit: "3PG" },
];

/** Sentinel league option that clears the league filter. */
export const ALL_LEAGUES = "All Leagues";

export interface LeaderRow {
	playerId: string;
	name: string;
	team: string;
	initials: string;
	/** Player detail link (`/players/{slug|id}`). */
	href: string;
	league: string;
	season: string;
	/** Games played (with recorded activity) in this bucket. */
	gp: number;
	/** Per-game average for every category, so the client can switch tabs freely. */
	vals: Record<StatKey, number>;
}

export interface LeadersData {
	rows: LeaderRow[];
	/** Distinct season names present, newest first. */
	seasons: string[];
	/** `[ALL_LEAGUES, ...league names]`. */
	leagues: string[];
	defaultSeason: string;
	/** Minimum games played to qualify for the leaderboard. */
	minGames: number;
}
