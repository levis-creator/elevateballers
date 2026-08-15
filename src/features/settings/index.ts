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
export * from './application/competitionSettings';
export * from './application/standingsSettings';
export * from './application/fixturesSettings';
export * from './application/resultsSettings';
export * from './application/matchPageSettings';
export * from './application/leadersSettings';
export * from './application/registrationSettings';
export * from './application/teamPageSettings';
export * from './application/playersListSettings';
export * from './application/playerPageSettings';
export * from './application/staffPageSettings';
export * from './application/staffProfileSettings';
export * from './application/newsListSettings';
export * from './application/articlePageSettings';
export * from './application/playerOfTheWeekSettings';
export * from './application/notificationSettings';
export * from './application/securitySettings';
export * from './application/headerSettings';
export * from './application/footerSettings';
export * from './application/brandSettings';
export * from './domain/siteSetting';

export const siteSettingsService = new SiteSettingsService(
  new PrismaSiteSettingsRepository(prisma)
);
