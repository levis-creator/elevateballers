/** getStandingsData — loads the v2 standings, with a demo fallback. */
import type { StandingsData, StandingRow } from "@/features/standings/domain/entities/standings-v2";
import { fetchStandingsData } from "@/features/standings/data/datasources/standings-v2";

const DEMO: Array<[string, number, number, number, number, number, number]> = [
	// name, w, l, pf, pa, played, pts
	["Wolf Pack", 10, 2, 984, 872, 12, 30],
	["Eagle Warriors", 9, 3, 951, 889, 12, 27],
	["Coast Waves", 8, 4, 933, 901, 12, 24],
	["CBA Jets", 7, 5, 918, 902, 12, 21],
	["Alliance Queens", 6, 6, 890, 895, 12, 18],
	["Nairobi Thunder", 5, 7, 872, 910, 12, 15],
	["Fire Dragons", 4, 8, 860, 931, 12, 12],
	["Tiger Claws", 3, 9, 845, 948, 12, 9],
	["Rift Valley Rangers", 2, 10, 828, 962, 12, 6],
	["Kisumu Lakers", 1, 11, 810, 979, 12, 3],
];

const FALLBACK_ROWS: StandingRow[] = DEMO.map(([name, w, l, pf, pa, p, pts], i) => ({
	rank: i + 1,
	teamId: `demo-${i}`,
	name,
	initials: name.split(/\s+/).slice(0, 2).map((x) => x[0]).join("").toUpperCase(),
	href: "#",
	league: "Elevate Ballers League",
	p,
	w,
	d: 0,
	l,
	pf,
	pa,
	diff: pf - pa,
	pts,
}));

const FALLBACK: StandingsData = {
	rows: FALLBACK_ROWS,
	leagues: ["Elevate Ballers League"],
	seasonLabel: "2026 Season",
	playoffSpots: 8,
};

export async function getStandingsData(): Promise<StandingsData> {
	const data = await fetchStandingsData();
	return data ?? FALLBACK;
}
