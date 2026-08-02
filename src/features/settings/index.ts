import { prisma } from '../../lib/prisma';
import { SiteSettingsService } from './application/siteSettingsService';
import { PrismaSiteSettingsRepository } from './data/prismaSiteSettingsRepository';

export * from './application/siteSettingsService';
export * from './application/seoSettings';
export * from './application/contactSettings';
export * from './application/consentSettings';
export * from './application/systemSettings';
export * from './application/homeSettings';
export * from './application/aboutSettings';
export * from './application/rulesPageSettings';
export * from './application/contactPageSettings';
export * from './application/headerSettings';
export * from './application/footerSettings';
export * from './application/brandSettings';
export * from './domain/siteSetting';

export const siteSettingsService = new SiteSettingsService(
  new PrismaSiteSettingsRepository(prisma)
);
