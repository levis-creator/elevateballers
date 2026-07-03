/**
 * Demo data for the v2 home page sections.
 *
 * This is the single seam between the (currently hardcoded) content and the UI.
 * When wiring real data, replace these exports with CMS/DB queries — the section
 * components take this shape as props and won't need to change.
 */

export interface Match {
	day: string;
	mon: string;
	home: string;
	away: string;
	venue: string;
	time: string;
}

export interface Result {
	home: string;
	hs: number;
	away: string;
	as: number;
	homeColor: string;
	awayColor: string;
}

export interface NewsItem {
	cat: string;
	title: string;
	excerpt: string;
	date: string;
}

export interface Leader {
	name: string;
	team: string;
	val: number;
}

export type LeaderData = Record<string, Leader[]>;

export interface CountTargets {
	matches: number;
	players: number;
	teams: number;
	awards: number;
}

export interface MediaItem {
	type: "Images" | "Audio";
	label: string;
	span: boolean;
}

export const ticker: string[] = [
	"Queens storm into the EWBL final",
	"City Hawks host Alliance Queens this Saturday",
	"Travious Kitondo named Player of the Week",
	"Coast Waves climb to 2nd in the standings",
	"2026 League registration now open",
];

export const upcoming: Match[] = [
	{ day: "05", mon: "Jul", home: "City Hawks", away: "Alliance Queens", venue: "Nyayo Stadium", time: "4:00 PM" },
	{ day: "06", mon: "Jul", home: "Nairobi Thunder", away: "Coast Waves", venue: "Aga Khan Court", time: "2:30 PM" },
	{ day: "08", mon: "Jul", home: "CBA Jets", away: "Rift Valley Rangers", venue: "Nyayo Stadium", time: "6:00 PM" },
];

export const results: Result[] = [
	{ home: "CBA Jets", hs: 78, away: "City Hawks", as: 74 },
	{ home: "Alliance Queens", hs: 65, away: "Eldoret Blaze", as: 52 },
	{ home: "Coast Waves", hs: 81, away: "Kisumu Lakers", as: 69 },
].map((r) => ({
	...r,
	homeColor: r.hs > r.as ? "#141009" : "#a49a8d",
	awayColor: r.as > r.hs ? "#141009" : "#a49a8d",
}));

export const news: NewsItem[] = [
	{ cat: "Championships", title: "Queens Storm Into the EWBL Final", excerpt: "A dominant fourth quarter sealed a spot in the championship game for the reigning favorites.", date: "Jul 1, 2026" },
	{ cat: "Match report", title: "City Hawks Edge CBA Jets in Overtime Thriller", excerpt: "Two clutch free throws in the final seconds decided a game that had everything.", date: "Jun 29, 2026" },
	{ cat: "Interviews", title: "Travious Kitondo on Ice-Cold Shooting", excerpt: "The Player of the Week sits down to talk footwork, confidence, and big dreams.", date: "Jun 28, 2026" },
	{ cat: "Analysis", title: "Why the Three Is Reshaping the League", excerpt: "The math behind the shot that is changing how every team builds its offense.", date: "Jun 26, 2026" },
	{ cat: "Match report", title: "Coast Waves Sink Rift Valley Rangers", excerpt: "A wire-to-wire performance keeps the Waves firmly in the playoff hunt.", date: "Jun 24, 2026" },
	{ cat: "Championships", title: "Road to the 2026 Finals: What to Watch", excerpt: "The storylines, the matchups, and the players who will decide the title.", date: "Jun 22, 2026" },
];

export const newsCategories: string[] = ["All", "Interviews", "Championships", "Match report", "Analysis"];

export const leaderData: LeaderData = {
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

export const leaderTabs: string[] = ["Points", "Rebounds", "Assists"];

export const countTargets: CountTargets = { matches: 214, players: 372, teams: 24, awards: 18 };

export const media: MediaItem[] = [
	{ type: "Images", label: "game photo", span: true },
	{ type: "Audio", label: "podcast clip", span: false },
	{ type: "Images", label: "court shot", span: false },
	{ type: "Images", label: "action photo", span: false },
	{ type: "Audio", label: "post-game audio", span: false },
	{ type: "Images", label: "crowd photo", span: true },
];

export const mediaTabs: string[] = ["All", "Images", "Audio"];
