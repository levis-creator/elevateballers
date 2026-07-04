/**
 * Domain entities for the v2 home page (Clean Architecture).
 *
 * These are the UI-facing shapes each section consumes. The data layer maps raw
 * query results (Prisma DTOs) into these; the presentation layer never sees a
 * Prisma type. Kept intentionally small and view-oriented.
 */

/** A fixture card in "Upcoming Matches". `startDate` is an ISO string for
 *  structured data (null for demo/fallback rows, which are excluded from schema). */
export interface Match {
	day: string;
	mon: string;
	home: string;
	away: string;
	venue: string;
	time: string;
	startDate: string | null;
	/** Link to the match detail page, or null for demo/fallback rows. */
	href: string | null;
}

/** A completed-match card in "Recent Results". */
export interface Result {
	home: string;
	hs: number | string;
	away: string;
	as: number | string;
	homeColor: string;
	awayColor: string;
	/** Link to the match detail page, or null for demo/fallback rows. */
	href: string | null;
}

/** The hero "Next Match" card. */
export interface NextMatch {
	homeAbbr: string;
	home: string;
	awayAbbr: string;
	away: string;
	venue: string;
	when: string;
}

/** A news card / ticker item. `cat` is the display category. `image` is the
 *  article image URL, or null to fall back to the placeholder tile. */
export interface NewsItem {
	cat: string;
	title: string;
	excerpt: string;
	date: string;
	url: string;
	image: string | null;
	/** ISO published date for structured data; null for demo/fallback rows. */
	datePublished: string | null;
}

/** A single league-leader row. */
export interface Leader {
	name: string;
	team: string;
	val: number;
}

/** Leaders grouped by category tab (e.g. Points/Rebounds/Assists). */
export type LeaderData = Record<string, Leader[]>;

/** "By The Numbers" headline counts. */
export interface CountTargets {
	matches: number;
	players: number;
	teams: number;
	awards: number;
}

/** A featured-media tile. `image` is set for visual media, null for audio. */
export interface MediaItem {
	type: "Images" | "Audio";
	label: string;
	span: boolean;
	image: string | null;
}

/** A Player-of-the-Week stat tile. */
export interface PotwStat {
	value: string;
	label: string;
}

/** The Player of the Week spotlight. */
export interface Potw {
	name: string;
	teamLabel: string;
	image: string | null;
	description: string;
	stats: PotwStat[];
}

/** Everything the v2 home page needs, assembled by the use-case. */
export interface HomeData {
	// Always present — the use-case fills any gap with fallback content.
	nextMatch: NextMatch;
	upcoming: Match[];
	results: Result[];
	ticker: string[];
	news: NewsItem[];
	newsCategories: string[];
	leaderData: LeaderData;
	leaderTabs: string[];
	counts: CountTargets;
	media: MediaItem[];
	mediaTabs: string[];
	potw: Potw;
	registrationOpen: boolean;
}
