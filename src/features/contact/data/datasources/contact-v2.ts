/**
 * v2 Contact data source. Builds the quick-contact channels, visit info and
 * social links from the CMS-managed contact settings (reused via getFooterData),
 * and reads the editorial content (hero copy, form copy, topics, departments)
 * from the `contact_v2_content` setting merged over defaults.
 */
import { getFooterData } from "@/features/layout/domain/usecases/get-footer-data";
import { getSiteSettingByKey } from "@/features/cms/lib/queries";
import { getDisplayImageUrl } from "@/lib/asset-url";
import { CONTACT_CONTENT_KEY, parseContactContent } from "@/features/contact/lib/contact-content";
import type { ContactData, ContactChannel, ContactInfo } from "@/features/contact/domain/entities/contact-v2";

/** First phone number as a `tel:` link, normalised to +254 for Kenyan numbers. */
function telHref(phone: string): string {
	const first = phone.split(/[·,/]/)[0].trim();
	const digits = first.replace(/\D/g, "");
	const norm = digits.startsWith("0") ? `+254${digits.slice(1)}` : digits.startsWith("254") ? `+${digits}` : digits;
	return `tel:${norm}`;
}

const mapsHref = (address: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address}, Nairobi, Kenya`)}`;

export async function fetchContactData(): Promise<ContactData | null> {
	try {
		const [footer, contentSetting] = await Promise.all([
			getFooterData(),
			getSiteSettingByKey(CONTACT_CONTENT_KEY).catch(() => null),
		]);
		const content = parseContactContent(contentSetting?.value);
		const c = footer.contact;
		const firstPhone = c.phone.split(/[·,]/)[0].trim() || c.phone;

		const channels: ContactChannel[] = [
			{ icon: "phone", label: "Call us", value: firstPhone, action: "Call now", href: telHref(c.phone) },
			{ icon: "mail", label: "Email", value: c.email, action: "Send email", href: `mailto:${c.email}` },
			{ icon: "pin", label: "Visit", value: c.address, action: "Get directions", href: mapsHref(c.address) },
		];

		const info: ContactInfo[] = [
			{ k: "Address", v: c.address },
			{ k: "Hours", v: c.hours },
			{ k: "Phone", v: c.phone },
			{ k: "Email", v: c.email },
		].filter((i) => i.v && i.v.trim() !== "");

		return {
			hero: { eyebrow: content.heroEyebrow, title: content.heroTitle, blurb: content.heroBlurb },
			form: { heading: content.formHeading, intro: content.formIntro },
			mapImage: getDisplayImageUrl(content.mapImage),
			channels,
			topics: content.topics,
			info,
			departments: content.departments.map((d) => ({ ...d, href: `mailto:${d.email}` })),
			socials: footer.socials,
		};
	} catch {
		return null;
	}
}
