/**
 * getHomeData — the v2 home page's single data use-case.
 *
 * Fetches every section in parallel via the data source and falls back to demo
 * content per-section when a query fails or returns nothing, so the page always
 * renders a complete design (same resilience as v1's per-query try/catch).
 */
import type { HomeData } from "@/features/home/domain/entities/home-v2";
import {
	fetchFixtures,
	fetchResults,
	fetchNews,
	fetchMedia,
	fetchStats,
	fetchPotw,
	fetchRegistrationOpen,
} from "@/features/home/data/datasources/home-v2";
import {
	FALLBACK_NEXT_MATCH,
	FALLBACK_UPCOMING,
	FALLBACK_RESULTS,
	FALLBACK_TICKER,
	FALLBACK_NEWS,
	FALLBACK_NEWS_CATEGORIES,
	FALLBACK_LEADER_DATA,
	FALLBACK_COUNTS,
	FALLBACK_MEDIA_TABS,
	FALLBACK_POTW,
} from "@/features/home/data/datasources/home-v2.fallback";

export async function getHomeData(): Promise<HomeData> {
	const [fixtures, results, newsRes, media, stats, reg] = await Promise.all([
		fetchFixtures(),
		fetchResults(),
		fetchNews(),
		fetchMedia(),
		fetchStats(),
		fetchRegistrationOpen(),
	]);
	const potw = await fetchPotw(stats?.statsByPlayer);

	// Leaders need at least one ranked player, else the section would be empty.
	const leaderData = stats && stats.leaderData.Points.length ? stats.leaderData : FALLBACK_LEADER_DATA;

	return {
		nextMatch: fixtures?.nextMatch ?? FALLBACK_NEXT_MATCH,
		upcoming: fixtures?.upcoming ?? FALLBACK_UPCOMING,
		results: results ?? FALLBACK_RESULTS,
		ticker: newsRes?.ticker.length ? newsRes.ticker : FALLBACK_TICKER,
		news: newsRes?.news ?? FALLBACK_NEWS,
		newsCategories: newsRes?.categories ?? FALLBACK_NEWS_CATEGORIES,
		leaderData,
		leaderTabs: Object.keys(leaderData),
		counts: stats?.counts ?? FALLBACK_COUNTS,
		// Real featured media only — no demo fallback, so the section is hidden
		// on the page when there's nothing to show.
		media: media ?? [],
		mediaTabs: FALLBACK_MEDIA_TABS,
		potw: potw ?? FALLBACK_POTW,
		registrationOpen: reg ?? true,
	};
}
