import { resolvePublicMatchPageSettings, siteSettingsService } from '@/features/settings';

/**
 * Hours before tip-off that Team Portal lineups close, from Site Settings →
 * Matches. Falls back to the default if settings can't be read, so a settings
 * outage never reopens a closed lineup or locks an open one early.
 */
export async function getLineupDeadlineHours(): Promise<number> {
  const records = await siteSettingsService.list('match').catch(() => []);
  return resolvePublicMatchPageSettings(records).lineupDeadlineHours;
}
