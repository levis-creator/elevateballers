/**
 * Layout feature types
 */

export interface MenuItem {
  id: string;
  label: string;
  href: string;
  isActive?: boolean;
}

export interface SocialLink {
  platform: 'facebook' | 'instagram' | 'youtube' | 'twitter';
  url: string;
  icon: string;
}

export interface ContactInfo {
  address: string;
  phone: string;
  fax: string;
  email: string;
  schedule: string;
}

