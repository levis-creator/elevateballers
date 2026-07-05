/**
 * Demo fallback for the v2 Stat-Leaders page — shown only when the live query
 * fails or the league has no completed matches yet, so the page never renders
 * empty. Mirrors the design's sample roster.
 */
import type { LeadersData, LeaderRow, StatKey } from "@/features/stats/domain/entities/leaders-v2";
import { ALL_LEAGUES } from "@/features/stats/domain/entities/leaders-v2";

const initialsOf = (name: string): string => {
	const w = name.replace(/\(.*?\)/g, "").trim().split(/\s+/).filter(Boolean);
	return ((w[0]?.[0] || "") + (w[1]?.[0] || "")).toUpperCase() || "?";
};

// [name, team, league, gp, pts, reb, ast, stl, blk, tpg]
type Demo = [string, string, string, number, number, number, number, number, number, number];
const DEMO: Demo[] = [
	["Travious Kitondo", "CBA Jets", "Women's League", 6, 24.8, 5.1, 6.2, 2.8, 0.6, 3.1],
	["Brian Otieno", "City Hawks", "Women's League", 7, 22.1, 9.6, 4.3, 1.4, 0.9, 3.4],
	["Kevin Barasa", "Nairobi Thunder", "Senior Ballers", 6, 21.4, 12.7, 2.1, 0.8, 2.7, 1.2],
	["Faith Mwangi", "Alliance Queens", "Women's League", 5, 20.6, 6.4, 8.9, 2.3, 0.4, 1.7],
	["Dennis Mutua", "Karen Oilers", "Senior Ballers", 7, 19.9, 5.8, 7.7, 2.5, 0.7, 2.2],
	["Aisha Noor", "Coast Waves", "Women's League", 6, 18.9, 4.9, 6.8, 3.1, 0.3, 2.6],
	["Samuel Kiptoo", "Rift Valley Rangers", "Senior Ballers", 6, 18.2, 10.8, 3.4, 1.1, 2.2, 1.5],
	["John Kamau", "Don Bosco Nets", "Ballers League", 6, 17.7, 6.1, 5.9, 1.6, 0.8, 2.4],
	["Mercy Achieng", "Alliance Queens", "Women's League", 5, 16.3, 11.4, 4.1, 1.3, 1.9, 0.9],
	["Peter Njoroge", "Vikings", "Ballers League", 7, 15.8, 8.8, 3.2, 0.9, 1.6, 1.1],
];

function toRow(d: Demo): LeaderRow {
	const [name, team, league, gp, pts, reb, ast, stl, blk, tpg] = d;
	const vals: Record<StatKey, number> = {
		Points: pts,
		Rebounds: reb,
		Assists: ast,
		Steals: stl,
		Blocks: blk,
		"3-Pointers": tpg,
	};
	return { playerId: name, name, team, initials: initialsOf(name), href: "#", league, season: "2026 Season", gp, vals };
}

export const FALLBACK_LEADERS: LeadersData = {
	rows: DEMO.map(toRow),
	seasons: ["2026 Season"],
	leagues: [ALL_LEAGUES, "Ballers League", "Senior Ballers", "Women's League"],
	defaultSeason: "2026 Season",
	minGames: 1,
};
