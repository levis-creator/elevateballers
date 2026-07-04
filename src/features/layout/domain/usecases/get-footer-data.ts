/**
 * getFooterData — resolves footer contact info + social links from site
 * settings, falling back to defaults per field (v1 behaviour, clean-arch: reads
 * through the cms query rather than raw Prisma).
 */
import { getAllSiteSettings } from "@/features/cms/lib/queries";
import type { FooterData } from "@/features/layout/domain/entities/footer";
import { DEFAULT_FOOTER } from "@/features/layout/domain/entities/footer";

export async function getFooterData(): Promise<FooterData> {
	try {
		const settings = await getAllSiteSettings();
		const map = new Map<string, string>(settings.map((s: any) => [s.key, s.value]));
		const val = (key: string, fallback: string) => {
			const v = map.get(key);
			return v != null && String(v).trim() !== "" ? String(v) : fallback;
		};
		const d = DEFAULT_FOOTER;

		const socials = [
			{ label: "FB", url: val("social_facebook", d.socials[0].url) },
			{ label: "IG", url: val("social_instagram", d.socials[1].url) },
			{ label: "YT", url: val("social_youtube", d.socials[2].url) },
			{ label: "X", url: val("social_twitter", d.socials[3].url) },
		].filter((s) => s.url);

		return {
			contact: {
				address: val("contact_address", d.contact.address),
				hours: val("contact_hours", d.contact.hours),
				phone: val("contact_phone", d.contact.phone),
				fax: val("contact_fax", d.contact.fax),
				email: val("contact_email", d.contact.email),
			},
			socials,
		};
	} catch {
		return DEFAULT_FOOTER;
	}
}
