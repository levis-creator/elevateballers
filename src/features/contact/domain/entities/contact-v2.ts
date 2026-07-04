/**
 * v2 Contact page entities. Contact channels, visit info and socials are built
 * from the CMS-managed contact settings; the topic list and departments are
 * static editorial content.
 */

/** A quick-contact card (Call / Email / Visit). */
export interface ContactChannel {
	/** Icon key: "phone" | "mail" | "pin". */
	icon: string;
	label: string;
	value: string;
	action: string;
	href: string;
}

/** A labelled info line (Address / Hours / Phone / Email). */
export interface ContactInfo {
	k: string;
	v: string;
}

export interface ContactDepartment {
	name: string;
	desc: string;
	email: string;
	href: string;
}

export interface ContactSocial {
	label: string;
	url: string;
}

export interface ContactData {
	hero: { eyebrow: string; title: string; blurb: string };
	form: { heading: string; intro: string };
	/** Resolved map/venue image URL, or null → render the placeholder tile. */
	mapImage: string | null;
	channels: ContactChannel[];
	/** Options for the message form's "Topic" select. */
	topics: string[];
	info: ContactInfo[];
	departments: ContactDepartment[];
	socials: ContactSocial[];
}
