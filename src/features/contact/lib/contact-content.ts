/**
 * Editable Contact-page editorial content: hero copy, message-form copy, the
 * topic list, and the departments. Stored as one JSON `SiteSetting`
 * (`contact_v2_content`, category "contact"); the public page reads it merged
 * over these defaults, and the admin editor edits it. Dependency-free so both
 * server (public read) and client (admin editor) can import it.
 *
 * Contact channels, visit info and social links are NOT here — they come from
 * the existing Contact & Social settings (address / phone / email / socials).
 */

export interface ContactDepartmentItem {
	name: string;
	desc: string;
	email: string;
}

export interface ContactContent {
	heroEyebrow: string;
	heroTitle: string;
	heroBlurb: string;
	formHeading: string;
	formIntro: string;
	/** Map / venue image URL (optional; empty → placeholder tile). */
	mapImage: string;
	topics: string[];
	departments: ContactDepartmentItem[];
}

export const CONTACT_CONTENT_KEY = "contact_v2_content";

export const CONTACT_DEFAULTS: ContactContent = {
	heroEyebrow: "Get in Touch",
	heroTitle: "Contacts",
	heroBlurb:
		"Questions about fixtures, registration, transfers, or officiating? Reach the right desk below, or send us a message and we'll get back to you.",
	formHeading: "Send a message",
	formIntro: "Fill in the form and the right team will get back to you, usually within 48 hours.",
	mapImage: "",
	topics: [
		"General enquiry",
		"Team registration",
		"Player transfer",
		"Fixtures & scheduling",
		"Officiating & protests",
		"Media & partnerships",
	],
	departments: [
		{ name: "Registration", desc: "New teams, roster additions, and season sign-up.", email: "elevateballers@gmail.com" },
		{ name: "Transfers", desc: "Player transfer requests and approvals during the window.", email: "elevateballers@gmail.com" },
		{ name: "Fixtures & Results", desc: "Scheduling, fixture changes, and match reporting.", email: "ballers@elevateballers.com" },
		{ name: "Officiating", desc: "Referee assignments and protest procedure.", email: "ballers@elevateballers.com" },
		{ name: "Media & Partnerships", desc: "Press, content, and sponsorship enquiries.", email: "ballers@elevateballers.com" },
		{ name: "General", desc: "Anything else — we’ll point you to the right desk.", email: "ballers@elevateballers.com" },
	],
};

const nonEmpty = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";

const cleanTopics = (v: unknown): string[] | null =>
	Array.isArray(v) ? v.map((x) => String(x ?? "").trim()).filter(Boolean) : null;

const cleanDepartments = (v: unknown): ContactDepartmentItem[] | null =>
	Array.isArray(v)
		? v
				.map((x: any) => ({ name: String(x?.name ?? "").trim(), desc: String(x?.desc ?? "").trim(), email: String(x?.email ?? "").trim() }))
				.filter((d) => d.name || d.email)
		: null;

/** Merge stored (possibly partial) content over defaults so the page never renders a hole. */
export function mergeContactContent(stored: Partial<ContactContent> | null | undefined): ContactContent {
	const s = stored ?? {};
	const str = (key: keyof ContactContent) => (nonEmpty((s as any)[key]) ? String((s as any)[key]) : (CONTACT_DEFAULTS[key] as string));
	// Optional image URL: keep whatever is stored (empty = no image / use placeholder).
	const img = (key: keyof ContactContent) => (typeof (s as any)[key] === "string" ? String((s as any)[key]).trim() : "");
	const topics = cleanTopics(s.topics);
	const departments = cleanDepartments(s.departments);
	return {
		heroEyebrow: str("heroEyebrow"),
		heroTitle: str("heroTitle"),
		heroBlurb: str("heroBlurb"),
		formHeading: str("formHeading"),
		formIntro: str("formIntro"),
		mapImage: img("mapImage"),
		topics: topics && topics.length ? topics : CONTACT_DEFAULTS.topics,
		departments: departments && departments.length ? departments : CONTACT_DEFAULTS.departments,
	};
}

/** Parse a raw stored JSON string (or null) into a full ContactContent. */
export function parseContactContent(raw: string | null | undefined): ContactContent {
	if (!raw) return CONTACT_DEFAULTS;
	try {
		return mergeContactContent(JSON.parse(raw));
	} catch {
		return CONTACT_DEFAULTS;
	}
}
