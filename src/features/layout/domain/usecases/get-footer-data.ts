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
  resolvePublicContactSettings,
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
    const headerSettings = resolvePublicHeaderSettings(settings);
    const brandSettings = resolvePublicBrandSettings(settings);
    const contactSettings = resolvePublicContactSettings(settings);
    const footerSettings = resolvePublicFooterSettings(
      settings,
      headerSettings.logo,
      brandSettings.siteName,
      brandSettings.tagline
    );

    return {
      contact: {
        address: contactSettings.address,
        hours: contactSettings.hours,
        phone: contactSettings.phones,
        fax: '',
        email: contactSettings.email,
      },
      socials: contactSettings.socials,
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
