/**
 * Fallback (demo) content for the v2 home page.
 *
 * Used per-section by the getHomeData use-case whenever a real query fails or
 * returns nothing, so the page always renders (mirrors v1's try/catch-with-
 * defaults behaviour). Typed against the domain entities.
 */
import type {
	Match,
	Result,
	NextMatch,
	NewsItem,
	LeaderData,
	CountTargets,
	MediaItem,
	Potw,
} from "@/features/home/domain/entities/home-v2";

export const FALLBACK_NEXT_MATCH: NextMatch = {
	homeAbbr: "CH",
	home: "City Hawks",
	awayAbbr: "AG",
	away: "Alliance Queens",
	venue: "Nyayo Stadium",
	when: "Jul 5, 2026 · 4:00 PM",
};

export const FALLBACK_UPCOMING: Match[] = [
	{ day: "05", mon: "Jul", home: "City Hawks", away: "Alliance Queens", venue: "Nyayo Stadium", time: "4:00 PM", startDate: null, href: null },
	{ day: "06", mon: "Jul", home: "Nairobi Thunder", away: "Coast Waves", venue: "Aga Khan Court", time: "2:30 PM", startDate: null, href: null },
	{ day: "08", mon: "Jul", home: "CBA Jets", away: "Rift Valley Rangers", venue: "Nyayo Stadium", time: "6:00 PM", startDate: null, href: null },
];

export const FALLBACK_RESULTS: Result[] = [
	{ home: "CBA Jets", hs: 78, away: "City Hawks", as: 74 },
	{ home: "Alliance Queens", hs: 65, away: "Eldoret Blaze", as: 52 },
	{ home: "Coast Waves", hs: 81, away: "Kisumu Lakers", as: 69 },
].map((r) => ({
	...r,
	homeColor: r.hs > r.as ? "#141009" : "#a49a8d",
	awayColor: r.as > r.hs ? "#141009" : "#a49a8d",
	href: null,
}));

export const FALLBACK_TICKER: string[] = [
	"Queens storm into the EWBL final",
	"City Hawks host Alliance Queens this Saturday",
	"Travious Kitondo named Player of the Week",
	"Coast Waves climb to 2nd in the standings",
	"2026 League registration now open",
];

const RAW_FALLBACK_NEWS = [
	{ cat: "Championships", title: "Queens Storm Into the EWBL Final", excerpt: "A dominant fourth quarter sealed a spot in the championship game for the reigning favorites.", date: "Jul 1, 2026", url: "/news" },
	{ cat: "Match report", title: "City Hawks Edge CBA Jets in Overtime Thriller", excerpt: "Two clutch free throws in the final seconds decided a game that had everything.", date: "Jun 29, 2026", url: "/news" },
	{ cat: "Interviews", title: "Travious Kitondo on Ice-Cold Shooting", excerpt: "The Player of the Week sits down to talk footwork, confidence, and big dreams.", date: "Jun 28, 2026", url: "/news" },
	{ cat: "Analysis", title: "Why the Three Is Reshaping the League", excerpt: "The math behind the shot that is changing how every team builds its offense.", date: "Jun 26, 2026", url: "/news" },
	{ cat: "Match report", title: "Coast Waves Sink Rift Valley Rangers", excerpt: "A wire-to-wire performance keeps the Waves firmly in the playoff hunt.", date: "Jun 24, 2026", url: "/news" },
	{ cat: "Championships", title: "Road to the 2026 Finals: What to Watch", excerpt: "The storylines, the matchups, and the players who will decide the title.", date: "Jun 22, 2026", url: "/news" },
];

export const FALLBACK_NEWS: NewsItem[] = RAW_FALLBACK_NEWS.map((n) => ({ ...n, image: null, datePublished: null }));

export const FALLBACK_NEWS_CATEGORIES: string[] = ["All", "Interviews", "Championships", "Match report", "Analysis"];

export const FALLBACK_LEADER_DATA: LeaderData = {
	Points: [
		{ name: "Travious Kitondo", team: "CBA Jets", val: 24.8 },
		{ name: "Brian Otieno", team: "City Hawks", val: 22.1 },
		{ name: "Faith Mwangi", team: "Alliance Queens", val: 20.6 },
		{ name: "Kevin Barasa", team: "Nairobi Thunder", val: 19.4 },
		{ name: "Aisha Noor", team: "Coast Waves", val: 18.9 },
	],
	Rebounds: [
		{ name: "Kevin Barasa", team: "Nairobi Thunder", val: 12.7 },
		{ name: "Mercy Achieng", team: "Alliance Queens", val: 11.4 },
		{ name: "Samuel Kiptoo", team: "Rift Valley Rangers", val: 10.8 },
		{ name: "Brian Otieno", team: "City Hawks", val: 9.6 },
		{ name: "Grace Wanjiru", team: "Coast Waves", val: 9.1 },
	],
	Assists: [
		{ name: "Faith Mwangi", team: "Alliance Queens", val: 8.9 },
		{ name: "Dennis Mutua", team: "City Hawks", val: 7.7 },
		{ name: "Aisha Noor", team: "Coast Waves", val: 6.8 },
		{ name: "Travious Kitondo", team: "CBA Jets", val: 6.2 },
		{ name: "John Kamau", team: "Eldoret Blaze", val: 5.9 },
	],
};

export const FALLBACK_LEADER_TABS: string[] = ["Points", "Rebounds", "Assists"];

export const FALLBACK_COUNTS: CountTargets = { matches: 214, players: 372, teams: 24, awards: 18 };

export const FALLBACK_MEDIA: MediaItem[] = [
	{ type: "Images", label: "game photo", span: true, image: null },
	{ type: "Audio", label: "podcast clip", span: false, image: null },
	{ type: "Images", label: "court shot", span: false, image: null },
	{ type: "Images", label: "action photo", span: false, image: null },
	{ type: "Audio", label: "post-game audio", span: false, image: null },
	{ type: "Images", label: "crowd photo", span: true, image: null },
];

export const FALLBACK_MEDIA_TABS: string[] = ["All", "Images", "Audio"];

export const FALLBACK_POTW: Potw = {
	name: "Travious Kitondo",
	teamLabel: "CBA Jets · #7",
	image: null,
	description:
		"Size, physicality, strength — none of which Travious has. But inside that lean frame is a mean competitor, a silent assassin afraid of no one on the court. All game long she was quiet, calculating and methodical as she tore City Hawks to shreds.",
	stats: [
		{ value: "27", label: "Points" },
		{ value: "6", label: "Threes" },
		{ value: "5", label: "Assists" },
	],
};
