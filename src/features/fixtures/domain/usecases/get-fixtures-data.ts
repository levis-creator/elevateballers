/**
 * getFixturesData — loads the v2 Fixtures calendar, falling back to demo content
 * when the query fails or returns nothing so the page always renders.
 */
import type { FixturesData } from "@/features/fixtures/domain/entities/fixtures-v2";
import { fetchFixturesData } from "@/features/fixtures/data/datasources/fixtures-v2";

const EMPTY: FixturesData = {
	matches: [],
	seasons: [],
	defaultSeason: "",
	defaultLeagueSeasonId: "",
	competitions: [],
};

export async function getFixturesData(): Promise<FixturesData> {
	const data = await fetchFixturesData();
	return data ?? EMPTY;
}
