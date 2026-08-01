/**
 * getFooterData — resolves footer contact info + social links from site
 * settings, falling back to defaults per field (v1 behaviour, clean-arch: reads
 * through the cms query rather than raw Prisma).
 */
import { getAllSiteSettings } from '@/features/cms/lib/queries';
import type { FooterData } from '@/features/layout/domain/entities/footer';
import { DEFAULT_FOOTER } from '@/features/layout/domain/entities/footer';
import { FOOTER_CONTENT_KEY, parseFooterContent } from '@/features/layout/lib/footer-content';
import { getSponsors } from '@/features/cms/lib/editorial-queries';
import {
  resolvePublicBrandSettings,
  resolvePublicFooterSettings,
  resolvePublicHeaderSettings,
} from '@/features/settings';

export async function getFooterData(): Promise<FooterData> {
  try {
    const [settings, sponsorRecords] = await Promise.all([
      getAllSiteSettings(),
      getSponsors(true).catch(() => []),
    ]);
		const map = new Map<string, string>(settings.map((setting) => [setting.key, setting.value]));
    const val = (key: string, fallback: string) => {
      const v = map.get(key);
      return v != null && String(v).trim() !== '' ? String(v) : fallback;
    };
    const d = DEFAULT_FOOTER;
    const headerSettings = resolvePublicHeaderSettings(settings);
    const brandSettings = resolvePublicBrandSettings(settings);
    const footerSettings = resolvePublicFooterSettings(
      settings,
      headerSettings.logo,
      brandSettings.siteName,
      brandSettings.tagline
    );

    const socials = [
      { label: 'FB', url: val('social_facebook', d.socials[0].url) },
      { label: 'IG', url: val('social_instagram', d.socials[1].url) },
      { label: 'YT', url: val('social_youtube', d.socials[2].url) },
      { label: 'X', url: val('social_twitter', d.socials[3].url) },
    ].filter((s) => s.url);

    return {
      contact: {
        address: val('contact_address', d.contact.address),
        hours: val('contact_hours', d.contact.hours),
        phone: val('contact_phone', d.contact.phone),
        fax: val('contact_fax', d.contact.fax),
        email: val('contact_email', d.contact.email),
      },
      socials,
      content: parseFooterContent(map.get(FOOTER_CONTENT_KEY)),
      settings: footerSettings,
			sponsors: sponsorRecords.map((sponsor) => ({
        id: String(sponsor.id),
        name: String(sponsor.name || 'Sponsor'),
        image: String(sponsor.image || ''),
        link: sponsor.link ? String(sponsor.link) : null,
      })),
    };
  } catch {
    return DEFAULT_FOOTER;
  }
}
