/**
 * Editable v2 About-page content. Stored as one JSON `SiteSetting`
 * (`about_v2_content`, category "about"); the public page reads it merged over
 * ABOUT_DEFAULTS, and the admin editor edits and saves it. Kept dependency-free
 * so both the server (public read) and the client (admin editor) can import it.
 *
 * Only editorial copy lives here. Quantitative data (stat counts, per-league
 * team/player counts, venue contacts) stays computed from live queries.
 */

export interface AboutValueItem {
	title: string;
	body: string;
}
export interface AboutTimelineItem {
	year: string;
	title: string;
	body: string;
}
export interface AboutPersonItem {
	name: string;
	role: string;
	/** Portrait URL (optional); empty → placeholder tile. */
	image: string;
}

export interface AboutContent {
	heroEyebrow: string;
	heroTitleLead: string;
	heroTitleAccent: string;
	heroBlurb: string;

	storyEyebrow: string;
	storyHeading: string;
	/** Paragraphs separated by blank lines. */
	storyBody: string;
	/** Story feature image URL (optional; empty → placeholder tile). */
	storyImage: string;

	leaguesEyebrow: string;
	leaguesHeading: string;

	valuesEyebrow: string;
	valuesHeading: string;
	values: AboutValueItem[];

	timelineEyebrow: string;
	timelineHeading: string;
	timeline: AboutTimelineItem[];

	peopleEyebrow: string;
	peopleHeading: string;
	people: AboutPersonItem[];

	venueEyebrow: string;
	venueHeading: string;
	venueBody: string;
	/** Venue image URL (optional; empty → placeholder tile). */
	venueImage: string;

	ctaHeading: string;
	ctaBody: string;
}

/** The site setting key holding the JSON blob above. */
export const ABOUT_CONTENT_KEY = "about_v2_content";

export const ABOUT_DEFAULTS: AboutContent = {
	heroEyebrow: "About the Club",
	heroTitleLead: "Built for the love of the",
	heroTitleAccent: "game",
	heroBlurb:
		"Elevate Ballers is Kenya's home for competitive basketball — a community league in Nairobi where clubs, players, and fans come together every week to compete, grow, and celebrate the game.",

	storyEyebrow: "Our Story",
	storyHeading: "From a weekend run to a league",
	storyBody:
		"What started as a handful of friends looking for organised, competitive hoops has grown into one of Nairobi's most active basketball communities. Elevate Ballers was founded to give players a real stage — proper fixtures, standings that matter, and the structure to turn casual runs into a genuine season.\n\nToday the club runs competitive leagues side by side — bringing together school teams, academies, corporate sides, and community clubs from across the city, all chasing the same title.\n\nEvery week, standings update after each game, a Player of the Week is crowned, and the next generation of Kenyan talent gets the reps, the competition, and the spotlight they deserve.",
	storyImage: "",

	leaguesEyebrow: "Our Leagues, One Community",
	leaguesHeading: "Where everyone plays",

	valuesEyebrow: "What We Stand For",
	valuesHeading: "Our values",
	values: [
		{ title: "Competition", body: "Real fixtures, real standings, real stakes. Every game counts toward the season." },
		{ title: "Community", body: "A welcoming space for players and fans of every level to belong." },
		{ title: "Development", body: "Reps, coaching, and a platform for the next generation of Kenyan talent." },
		{ title: "Fair Play", body: "Clear rules, consistent officiating, and respect on and off the court." },
	],

	timelineEyebrow: "The Journey",
	timelineHeading: "How we got here",
	timeline: [
		{ year: "2024", title: "The First Tip-Off", body: "Elevate Ballers launches with a handful of clubs and a shared love of the game." },
		{ year: "2025", title: "The Women’s League Arrives", body: "A dedicated women’s league is founded, opening a competitive stage for women’s basketball." },
		{ year: "2025", title: "Standings Go Live", body: "Weekly standings, Player of the Week, and league stats become part of every matchday." },
		{ year: "2026", title: "A Growing Community", body: "Clubs from across Nairobi competing every weekend." },
	],

	peopleEyebrow: "The People",
	peopleHeading: "Who runs it",
	people: [
		{ name: "League Commissioner", role: "Operations", image: "" },
		{ name: "Competitions Lead", role: "Fixtures & Results", image: "" },
		{ name: "Head of Officiating", role: "Referees", image: "" },
		{ name: "Community Manager", role: "Clubs & Players", image: "" },
	],

	venueEyebrow: "Home Court",
	venueHeading: "Come watch a game",
	venueBody:
		"Our home base sits off Dagoretti Road in Nairobi, with fixtures across the city's top courts. Games run on weekends — free to attend, and always worth the trip.",
	venueImage: "",

	ctaHeading: "Be part of it",
	ctaBody: "Register a team, join as a player, or just come support. There's a place for everyone at Elevate Ballers.",
};

const isNonEmptyString = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";

const cleanValues = (v: unknown): AboutValueItem[] | null =>
	Array.isArray(v)
		? v
				.map((x: any) => ({ title: String(x?.title ?? "").trim(), body: String(x?.body ?? "").trim() }))
				.filter((x) => x.title || x.body)
		: null;

const cleanTimeline = (v: unknown): AboutTimelineItem[] | null =>
	Array.isArray(v)
		? v
				.map((x: any) => ({ year: String(x?.year ?? "").trim(), title: String(x?.title ?? "").trim(), body: String(x?.body ?? "").trim() }))
				.filter((x) => x.year || x.title || x.body)
		: null;

const cleanPeople = (v: unknown): AboutPersonItem[] | null =>
	Array.isArray(v)
		? v
				.map((x: any) => ({ name: String(x?.name ?? "").trim(), role: String(x?.role ?? "").trim(), image: String(x?.image ?? "").trim() }))
				.filter((x) => x.name || x.role)
		: null;

/**
 * Merge a stored (possibly partial/invalid) content object over the defaults.
 * Missing / blank scalars and empty arrays fall back to the default so the page
 * never renders a hole.
 */
export function mergeAboutContent(stored: Partial<AboutContent> | null | undefined): AboutContent {
	const s = stored ?? {};
	const str = (key: keyof AboutContent) => (isNonEmptyString((s as any)[key]) ? String((s as any)[key]) : (ABOUT_DEFAULTS[key] as string));
	// Optional image URLs: keep whatever is stored (empty = no image / use placeholder).
	const img = (key: keyof AboutContent) => (typeof (s as any)[key] === "string" ? String((s as any)[key]).trim() : "");
	// storyBody/venueBody may legitimately contain blank lines but must be non-empty.
	const values = cleanValues(s.values);
	const timeline = cleanTimeline(s.timeline);
	const people = cleanPeople(s.people);
	return {
		heroEyebrow: str("heroEyebrow"),
		heroTitleLead: str("heroTitleLead"),
		heroTitleAccent: str("heroTitleAccent"),
		heroBlurb: str("heroBlurb"),
		storyEyebrow: str("storyEyebrow"),
		storyHeading: str("storyHeading"),
		storyBody: str("storyBody"),
		storyImage: img("storyImage"),
		leaguesEyebrow: str("leaguesEyebrow"),
		leaguesHeading: str("leaguesHeading"),
		valuesEyebrow: str("valuesEyebrow"),
		valuesHeading: str("valuesHeading"),
		values: values && values.length ? values : ABOUT_DEFAULTS.values,
		timelineEyebrow: str("timelineEyebrow"),
		timelineHeading: str("timelineHeading"),
		timeline: timeline && timeline.length ? timeline : ABOUT_DEFAULTS.timeline,
		peopleEyebrow: str("peopleEyebrow"),
		peopleHeading: str("peopleHeading"),
		people: people && people.length ? people : ABOUT_DEFAULTS.people,
		venueEyebrow: str("venueEyebrow"),
		venueHeading: str("venueHeading"),
		venueBody: str("venueBody"),
		venueImage: img("venueImage"),
		ctaHeading: str("ctaHeading"),
		ctaBody: str("ctaBody"),
	};
}

/** Parse a raw stored JSON string (or null) into a full AboutContent. */
export function parseAboutContent(raw: string | null | undefined): AboutContent {
	if (!raw) return { ...ABOUT_DEFAULTS };
	try {
		return mergeAboutContent(JSON.parse(raw));
	} catch {
		return { ...ABOUT_DEFAULTS };
	}
}

/** Split a multi-paragraph body (blank-line separated) into paragraphs. */
export function splitParagraphs(body: string): string[] {
	const parts = body
		.split(/\n\s*\n/)
		.map((p) => p.trim())
		.filter(Boolean);
	return parts.length ? parts : [body.trim()].filter(Boolean);
}
