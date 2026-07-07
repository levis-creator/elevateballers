/**
 * Footer editorial content — the parts of the footer that aren't contact/social
 * (those live in the contact_* / social_* settings). Stored as ONE JSON
 * SiteSetting (`footer_v2_content`) and imported by BOTH the public footer
 * (get-footer-data) and the admin editor (FooterSettingsEditor) so they can't
 * drift. Anything missing/invalid falls back to the defaults below.
 */
export interface FooterLink {
	label: string;
	href: string;
}

export interface FooterContent {
	/** "Explore" column links. */
	exploreTitle: string;
	exploreLinks: FooterLink[];
	/** Newsletter column heading + blurb. */
	newsletterTitle: string;
	newsletterText: string;
	/** Bottom bar. */
	copyright: string;
}

export const FOOTER_CONTENT_KEY = "footer_v2_content";

export const FOOTER_DEFAULTS: FooterContent = {
	exploreTitle: "Explore",
	exploreLinks: [
		{ label: "Teams", href: "/teams" },
		{ label: "Standings", href: "/standings" },
		{ label: "Fixtures & Results", href: "/upcoming-fixtures" },
		{ label: "Staff", href: "/staff" },
		{ label: "About the Club", href: "/about-club" },
		{ label: "Rules", href: "/rules" },
		{ label: "Cookies", href: "/cookies" },
	],
	newsletterTitle: "Sign up for email alerts",
	newsletterText: "Select topics and stay current with our latest news.",
	copyright: "© 2024–2026 Elevate Ballers · All Rights Reserved",
};

const str = (v: unknown, fallback: string): string => (typeof v === "string" && v.trim() !== "" ? v : fallback);

/** Parse the stored JSON value and merge over defaults. Never throws. */
export function parseFooterContent(value?: string | null): FooterContent {
	if (!value) return { ...FOOTER_DEFAULTS };
	let raw: any;
	try {
		raw = JSON.parse(value);
	} catch {
		return { ...FOOTER_DEFAULTS };
	}
	if (!raw || typeof raw !== "object") return { ...FOOTER_DEFAULTS };

	const links = Array.isArray(raw.exploreLinks)
		? raw.exploreLinks
				.map((l: any) => ({ label: str(l?.label, ""), href: str(l?.href, "") }))
				.filter((l: FooterLink) => l.label && l.href)
		: FOOTER_DEFAULTS.exploreLinks;

	return {
		exploreTitle: str(raw.exploreTitle, FOOTER_DEFAULTS.exploreTitle),
		exploreLinks: links.length ? links : FOOTER_DEFAULTS.exploreLinks,
		newsletterTitle: str(raw.newsletterTitle, FOOTER_DEFAULTS.newsletterTitle),
		newsletterText: str(raw.newsletterText, FOOTER_DEFAULTS.newsletterText),
		copyright: str(raw.copyright, FOOTER_DEFAULTS.copyright),
	};
}
