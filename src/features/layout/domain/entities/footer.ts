/**
 * Footer domain entity + defaults.
 *
 * Contact details and social links are admin-editable via site settings
 * (contact_* / social_* keys). Defaults mirror v1's footer so behaviour is
 * unchanged until an admin overrides them.
 */
export interface SocialLink {
  /** Short label shown in the icon tile (FB / IG / YT / X). */
  label: string;
  url: string;
}

export interface FooterContact {
  address: string;
  hours: string;
  phone: string;
  fax: string;
  email: string;
}

import type { FooterContent } from '@/features/layout/lib/footer-content';
import { FOOTER_DEFAULTS } from '@/features/layout/lib/footer-content';
import type { PublicFooterSettings } from '@/features/settings/application/footerSettings';
import { DEFAULT_PUBLIC_FOOTER_SETTINGS } from '@/features/settings/application/footerSettings';

export interface FooterSponsor {
  id: string;
  name: string;
  image: string;
  link: string | null;
}

export interface FooterData {
  contact: FooterContact;
  socials: SocialLink[];
  /** Editorial content (explore links, newsletter text, copyright) — CMS-editable. */
  content: FooterContent;
  settings: PublicFooterSettings;
  sponsors: FooterSponsor[];
}

export const DEFAULT_FOOTER: FooterData = {
  contact: {
    address: 'Pepo Lane, off Dagoretti Road',
    hours: 'Sat–Sun · 8am – 6pm',
    phone: '0703 913 923',
    fax: '0729 259 496',
    email: 'ballers@elevateballers.com',
  },
  socials: [
    { label: 'FB', url: 'https://www.facebook.com/Elevateballers' },
    { label: 'IG', url: 'https://www.instagram.com/elevateballers/' },
    { label: 'YT', url: 'https://www.youtube.com/@elevateballers9389/featured' },
    { label: 'X', url: 'https://twitter.com/elevateballers/' },
  ],
  content: FOOTER_DEFAULTS,
  settings: DEFAULT_PUBLIC_FOOTER_SETTINGS,
  sponsors: [],
};
