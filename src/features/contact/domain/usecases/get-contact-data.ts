/**
 * getContactData — loads the v2 Contact page, falling back to static defaults so
 * the page always renders.
 */
import type { ContactData } from "@/features/contact/domain/entities/contact-v2";
import { fetchContactData } from "@/features/contact/data/datasources/contact-v2";
import { CONTACT_DEFAULTS } from "@/features/contact/lib/contact-content";

const FALLBACK: ContactData = {
	hero: { eyebrow: CONTACT_DEFAULTS.heroEyebrow, title: CONTACT_DEFAULTS.heroTitle, blurb: CONTACT_DEFAULTS.heroBlurb },
	form: { heading: CONTACT_DEFAULTS.formHeading, intro: CONTACT_DEFAULTS.formIntro },
	mapImage: null,
	channels: [
		{ icon: "phone", label: "Call us", value: "0703 913 923", action: "Call now", href: "tel:+254703913923" },
		{ icon: "mail", label: "Email", value: "ballers@elevateballers.com", action: "Send email", href: "mailto:ballers@elevateballers.com" },
		{ icon: "pin", label: "Visit", value: "Pepo Lane, off Dagoretti Road", action: "Get directions", href: "https://www.google.com/maps/search/?api=1&query=Pepo%20Lane%2C%20Dagoretti%20Road%2C%20Nairobi" },
	],
	topics: CONTACT_DEFAULTS.topics,
	info: [
		{ k: "Address", v: "Pepo Lane, off Dagoretti Road, Nairobi, Kenya" },
		{ k: "Hours", v: "Saturdays & Sundays · 8:00 AM – 6:00 PM" },
		{ k: "Phone", v: "0703 913 923 · 0729 259 496" },
		{ k: "Email", v: "ballers@elevateballers.com" },
	],
	departments: CONTACT_DEFAULTS.departments.map((d) => ({ ...d, href: `mailto:${d.email}` })),
	socials: [],
};

export async function getContactData(): Promise<ContactData> {
	return (await fetchContactData()) ?? FALLBACK;
}
