import { prisma } from '../../lib/prisma';
import { SiteSettingsService } from './application/siteSettingsService';
import { PrismaSiteSettingsRepository } from './data/prismaSiteSettingsRepository';

export * from './application/siteSettingsService';
export * from './application/headerSettings';
export * from './application/footerSettings';
export * from './application/brandSettings';
export * from './domain/siteSetting';

export const siteSettingsService = new SiteSettingsService(
  new PrismaSiteSettingsRepository(prisma)
);
