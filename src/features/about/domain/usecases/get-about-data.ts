/**
 * getAboutData — composes the v2 About page:
 *  - editorial copy (hero, story, section headings, values, timeline, people,
 *    venue, CTA) from the CMS-editable `about_v2_content` setting, merged over
 *    defaults so the page always renders;
 *  - quantitative data (stat counts, per-league counts, venue contacts) from
 *    live queries, with demo fallbacks.
 */
import type { AboutData, AboutStat, AboutLeague, AboutContact } from "@/features/about/domain/entities/about-v2";
import { fetchAboutDynamic, fetchAboutContent } from "@/features/about/data/datasources/about-v2";
import { splitParagraphs } from "@/features/about/lib/about-content";
import { getDisplayImageUrl } from "@/lib/asset-url";

// Fallbacks for the dynamic parts (used only when the query fails).
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
	const [content, dyn] = await Promise.all([fetchAboutContent(), fetchAboutDynamic()]);

	return {
		hero: {
			eyebrow: content.heroEyebrow,
			titleLead: content.heroTitleLead,
			titleAccent: content.heroTitleAccent,
			blurb: content.heroBlurb,
		},
		story: {
			eyebrow: content.storyEyebrow,
			heading: content.storyHeading,
			paragraphs: splitParagraphs(content.storyBody),
			image: getDisplayImageUrl(content.storyImage),
		},
		leaguesIntro: { eyebrow: content.leaguesEyebrow, heading: content.leaguesHeading },
		valuesIntro: { eyebrow: content.valuesEyebrow, heading: content.valuesHeading },
		timelineIntro: { eyebrow: content.timelineEyebrow, heading: content.timelineHeading },
		peopleIntro: { eyebrow: content.peopleEyebrow, heading: content.peopleHeading },
		venue: { eyebrow: content.venueEyebrow, heading: content.venueHeading, body: content.venueBody, image: getDisplayImageUrl(content.venueImage) },
		cta: { heading: content.ctaHeading, body: content.ctaBody },

		stats: dyn?.stats ?? FALLBACK_STATS,
		leagues: dyn?.leagues.length ? dyn.leagues : FALLBACK_LEAGUES,
		contacts: dyn?.contacts ?? FALLBACK_CONTACTS,

		values: content.values.map((v, i) => ({ num: String(i + 1).padStart(2, "0"), title: v.title, body: v.body })),
		timeline: content.timeline.map((t) => ({ year: t.year, title: t.title, body: t.body })),
		people: content.people.map((p) => ({ name: p.name, role: p.role, image: getDisplayImageUrl(p.image) })),
	};
}
