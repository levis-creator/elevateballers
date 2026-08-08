/**
 * Server-side registration gate. Loads the relevant league/season and applies
 * the pure `isRegistrationOpen` rules. This is the authoritative check — the
 * form UI mirrors it for messaging, but this is what actually blocks writes.
 */
import { prisma } from './prisma';
import {
  isRegistrationOpen,
  registrationClosedMessage,
  type RegistrationStatus,
} from './registration';
import { resolveLeagueSeasonScope } from '../features/seasons/data/league-season-scope';

export interface RegistrationGateResult {
  open: boolean;
  message?: string;
  status?: RegistrationStatus;
}

export interface RegistrationGateOptions {
  /** The Site Settings master switch has already been validated by the caller.
   * Keep league/edition date windows, but do not let a legacy per-league switch
   * contradict the public registration setting. */
  siteMasterOpen?: boolean;
}

/**
 * Checks whether registration is currently open for the given league (and
 * optional season). A missing/blank leagueId leaves the gate open — callers
 * that require a league should validate that separately.
 */
export async function checkRegistrationOpen(
  leagueId?: string | null,
  seasonId?: string | null,
  leagueSeasonId?: string | null,
  options: RegistrationGateOptions = {},
): Promise<RegistrationGateResult> {
  if (!leagueId) return { open: true };

  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    select: {
      registrationOpen: true,
      registrationOpensAt: true,
      registrationClosesAt: true,
    },
  });

  // Unknown league: don't block here — field validation handles bad IDs.
  if (!league) return { open: true };

  // A season is shared across leagues (many-to-many). Only apply its window if
  // the season actually runs in this league; otherwise the pairing is invalid.
  const scope = seasonId
    ? await resolveLeagueSeasonScope({ leagueSeasonId, leagueId, seasonId })
    : null;
  const season = scope
    ? await prisma.leagueSeason.findUnique({
        where: { id: scope.leagueSeasonId },
        select: { registrationOpensAt: true, registrationClosesAt: true },
      })
    : null;

  const status = isRegistrationOpen(
    options.siteMasterOpen ? { ...league, registrationOpen: true } : league,
    season,
  );
  if (status.open) return { open: true, status };

  return { open: false, status, message: registrationClosedMessage(status) };
}
