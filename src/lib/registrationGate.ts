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

export interface RegistrationGateResult {
  open: boolean;
  message?: string;
  status?: RegistrationStatus;
}

/**
 * Checks whether registration is currently open for the given league (and
 * optional season). A missing/blank leagueId leaves the gate open — callers
 * that require a league should validate that separately.
 */
export async function checkRegistrationOpen(
  leagueId?: string | null,
  seasonId?: string | null
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

  const season = seasonId
    ? await prisma.season.findUnique({
        where: { id: seasonId },
        select: { registrationOpensAt: true, registrationClosesAt: true },
      })
    : null;

  const status = isRegistrationOpen(league, season);
  if (status.open) return { open: true, status };

  return { open: false, status, message: registrationClosedMessage(status) };
}
