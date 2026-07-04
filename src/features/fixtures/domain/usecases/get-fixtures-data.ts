/**
 * getFixturesData — loads the v2 Fixtures calendar, falling back to demo content
 * when the query fails or returns nothing so the page always renders.
 */
import type { FixtureMatch, FixturesData } from "@/features/fixtures/domain/entities/fixtures-v2";
import { fetchFixturesData } from "@/features/fixtures/data/datasources/fixtures-v2";

// name, abbr → crest when no logo exists in the demo set.
const demoMatch = (
	over: Partial<FixtureMatch> & Pick<FixtureMatch, "id" | "home" | "away" | "time">,
): FixtureMatch => ({
	href: "#",
	league: "Elevate Ballers League",
	season: "2026 Season",
	ts: 0,
	isoDate: "2026-07-05",
	day: "05",
	mon: "Jul",
	weekday: "Sunday",
	year: 2026,
	status: "upcoming",
	homeAbbr: over.home.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase(),
	awayAbbr: over.away.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase(),
	homeLogo: null,
	awayLogo: null,
	score: "",
	homeScore: null,
	awayScore: null,
	homeWin: false,
	awayWin: false,
	...over,
});

const FALLBACK: FixturesData = {
	matches: [
		demoMatch({ id: "d1", home: "City Hawks", away: "Alliance Queens", time: "04:00 PM", ts: 1_767_621_600_000 }),
		demoMatch({ id: "d2", home: "Karen Oilers", away: "Vortex", time: "06:00 PM", ts: 1_767_628_800_000 }),
		demoMatch({
			id: "d3",
			home: "Coast Waves",
			away: "Rift Valley Rangers",
			time: "04:00 PM",
			ts: 1_766_584_800_000,
			isoDate: "2026-06-24",
			day: "24",
			mon: "Jun",
			weekday: "Wednesday",
			status: "done",
			score: "81 – 69",
			homeScore: 81,
			awayScore: 69,
			homeWin: true,
		}),
	],
	seasons: ["2026 Season"],
	defaultSeason: "2026 Season",
};

export async function getFixturesData(): Promise<FixturesData> {
	const data = await fetchFixturesData();
	return data ?? FALLBACK;
}
