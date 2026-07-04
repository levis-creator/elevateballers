/**
 * getAboutData — composes the v2 About page: real quantitative data (stats,
 * league counts, contacts) merged with static editorial content (values,
 * timeline, leadership). Falls back to demo values for the dynamic parts so the
 * page always renders.
 */
import type {
	AboutData,
	AboutStat,
	AboutLeague,
	AboutContact,
	AboutValue,
	AboutMilestone,
	AboutPerson,
} from "@/features/about/domain/entities/about-v2";
import { fetchAboutDynamic } from "@/features/about/data/datasources/about-v2";

// --- editorial content (static; edit here, not in the DB) ---
const VALUES: AboutValue[] = [
	{ num: "01", title: "Competition", body: "Real fixtures, real standings, real stakes. Every game counts toward the season." },
	{ num: "02", title: "Community", body: "A welcoming space for players and fans of every level to belong." },
	{ num: "03", title: "Development", body: "Reps, coaching, and a platform for the next generation of Kenyan talent." },
	{ num: "04", title: "Fair Play", body: "Clear rules, consistent officiating, and respect on and off the court." },
];

const TIMELINE: AboutMilestone[] = [
	{ year: "2024", title: "The First Tip-Off", body: "Elevate Ballers launches with a handful of clubs and a shared love of the game." },
	{ year: "2025", title: "The Women’s League Arrives", body: "The EWBL is founded, opening a dedicated stage for women’s basketball." },
	{ year: "2025", title: "Standings Go Live", body: "Weekly standings, Player of the Week, and league stats become part of every matchday." },
	{ year: "2026", title: "A Growing Community", body: "Two leagues and clubs from across Nairobi competing every weekend." },
];

const PEOPLE: AboutPerson[] = [
	{ name: "League Commissioner", role: "Operations", image: null },
	{ name: "Competitions Lead", role: "Fixtures & Results", image: null },
	{ name: "Head of Officiating", role: "Referees", image: null },
	{ name: "Community Manager", role: "Clubs & Players", image: null },
];

// --- fallbacks for the dynamic parts (used only when the query fails) ---
const FALLBACK_STATS: AboutStat[] = [
	{ value: "24", label: "Clubs", accent: true },
	{ value: "370+", label: "Players", accent: false },
	{ value: "2", label: "Leagues", accent: false },
	{ value: "2024", label: "Founded", accent: true },
];

const FALLBACK_LEAGUES: AboutLeague[] = [
	{
		abbr: "EBL",
		title: "Elevate Basketball League",
		teams: "16",
		players: "240+",
		body: "The Elevate Basketball League brings together the city's top men's clubs, academies, and community sides in weekly competitive play.",
		dark: true,
	},
	{
		abbr: "EWBL",
		title: "Elevate Women's Basketball League",
		teams: "8",
		players: "130+",
		body: "The Elevate Women's Basketball League gives women's teams a dedicated, competitive stage — from school programs to established clubs.",
		dark: false,
	},
];

const FALLBACK_CONTACTS: AboutContact[] = [
	{ k: "Where", v: "Pepo Lane, off Dagoretti Road, Nairobi" },
	{ k: "When", v: "Saturdays & Sundays · 8:00 AM – 6:00 PM" },
	{ k: "Reach", v: "0703 913 923 · ballers@elevateballers.com" },
];

export async function getAboutData(): Promise<AboutData> {
	const dyn = await fetchAboutDynamic();
	return {
		stats: dyn?.stats ?? FALLBACK_STATS,
		leagues: dyn?.leagues.length ? dyn.leagues : FALLBACK_LEAGUES,
		contacts: dyn?.contacts ?? FALLBACK_CONTACTS,
		values: VALUES,
		timeline: TIMELINE,
		people: PEOPLE,
	};
}
