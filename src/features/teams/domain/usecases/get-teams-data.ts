/**
 * getTeamsData — loads the v2 Teams directory, falling back to demo content when
 * the query fails or returns nothing so the page always renders.
 */
import type { TeamsData, TeamCard } from "@/features/teams/domain/entities/teams-v2";
import { fetchTeamsData } from "@/features/teams/data/datasources/teams-v2";

const DEMO: Array<[string, string, string, number, string]> = [
	["City Hawks", "CH", "Nairobi Basketball League", 14, "Brian Otieno"],
	["Alliance Queens", "AQ", "Elevate Women's League", 12, "Faith Mwangi"],
	["CBA Jets", "CJ", "Nairobi Basketball League", 15, "Dennis Mutua"],
	["Coast Waves", "CW", "Coast Conference", 13, "Aisha Noor"],
	["Nairobi Thunder", "NT", "Nairobi Basketball League", 11, "Kevin Barasa"],
	["Rift Valley Rangers", "RR", "Rift Conference", 12, "Samuel Kiptoo"],
];
const DEMO_COLORS = ["#e4002b", "#1f6feb", "#2f9e44", "#f08c00", "#7048e8", "#0c8599"];

const FALLBACK_TEAMS: TeamCard[] = DEMO.map(([name, initials, league, players, coach], i) => ({
	id: `demo-${i}`,
	slug: name.toLowerCase().replace(/\s+/g, "-"),
	name,
	initials,
	league,
	leagueColor: DEMO_COLORS[i % DEMO_COLORS.length],
	coach,
	players,
	href: "#",
}));

const FALLBACK_TEAMS_DATA: TeamsData = {
	teams: FALLBACK_TEAMS,
	leagues: [
		{ label: "All Clubs", value: "all" },
		{ label: "Nairobi Basketball League", value: "Nairobi Basketball League" },
		{ label: "Elevate Women's League", value: "Elevate Women's League" },
		{ label: "Coast Conference", value: "Coast Conference" },
		{ label: "Rift Conference", value: "Rift Conference" },
	],
	totalCount: FALLBACK_TEAMS.length,
	leagueCount: 4,
};

export async function getTeamsData(): Promise<TeamsData> {
	const data = await fetchTeamsData();
	return data ?? FALLBACK_TEAMS_DATA;
}
