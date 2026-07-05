/**
 * getNewsListData — loads the v2 News list, with a demo fallback so the page
 * always renders.
 */
import type { NewsListData } from "@/features/news/domain/entities/news-list-v2";
import { fetchNewsListData } from "@/features/news/data/datasources/news-list-v2";

const FALLBACK: NewsListData = {
	articles: [
		{ cat: "Match Report", title: "Breaking Barriers Through Sports: The Star That Is Madina Okot", excerpt: "A young basketball star carrying the hopes and dreams of an entire country — from a volleyball court in Lugari to the WNBA.", date: "April 17, 2026", read: "4 min read", href: "#", image: null },
		{ cat: "Championships", title: "The Road to the 2026 EBL and EWBL Finals", excerpt: "The matchups, the storylines, and the players who will decide who lifts the trophy this season.", date: "February 11, 2026", read: "5 min read", href: "#", image: null },
		{ cat: "Match Report", title: "Queens Storm Into the EWBL Final", excerpt: "A commanding fourth quarter sealed a place in the championship game for the reigning favourites.", date: "January 28, 2026", read: "4 min read", href: "#", image: null },
		{ cat: "Interviews", title: "In Conversation: The Coaches Shaping Kenyan Basketball", excerpt: "The tacticians behind the league's brightest talents talk development, culture and the road ahead.", date: "January 20, 2026", read: "6 min read", href: "#", image: null },
	],
	categories: [
		{ label: "Match Report", count: 2 },
		{ label: "Championships", count: 1 },
		{ label: "Interviews", count: 1 },
	],
	archives: [
		{ label: "April 2026", count: 1 },
		{ label: "February 2026", count: 1 },
		{ label: "January 2026", count: 2 },
	],
};

export async function getNewsListData(): Promise<NewsListData> {
	return (await fetchNewsListData()) ?? FALLBACK;
}
