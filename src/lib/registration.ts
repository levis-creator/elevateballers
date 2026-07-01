/**
 * Registration window logic — the single source of truth for whether league
 * registration is currently open. Used by both the public API routes (as the
 * authoritative gate) and the registration form UI (for messaging).
 *
 * Rules (both levels must pass):
 *   1. The league's master switch (`registrationOpen`) must be on.
 *   2. `now` must fall inside the league's optional [opensAt, closesAt] window.
 *   3. If a season is given, `now` must also fall inside the season's optional window.
 *
 * A null bound means "unbounded" on that side, so a null window imposes no
 * time restriction at that level.
 */

/** Why registration is not open — useful for tailoring the message shown to users. */
export type RegistrationClosedReason =
  | 'closed' // league master switch is off
  | 'league-not-yet-open' // before the league's opensAt
  | 'league-deadline-passed' // after the league's closesAt
  | 'season-not-yet-open' // before the season's opensAt
  | 'season-deadline-passed'; // after the season's closesAt

export interface RegistrationStatus {
  open: boolean;
  reason?: RegistrationClosedReason;
  /** The effective deadline registrations must beat (earliest of league/season closesAt), if any. */
  closesAt?: Date | null;
  /** The effective date registration opens (latest of league/season opensAt), if any. */
  opensAt?: Date | null;
}

/** Minimal shape needed from a league — a subset of the Prisma League model. */
export interface RegistrationLeagueFields {
  registrationOpen: boolean;
  registrationOpensAt: Date | string | null;
  registrationClosesAt: Date | string | null;
}

/** Minimal shape needed from a season — a subset of the Prisma Season model. */
export interface RegistrationSeasonFields {
  registrationOpensAt: Date | string | null;
  registrationClosesAt: Date | string | null;
}

/** Coerce a nullable Date-or-ISO-string into a valid Date, or null if absent/invalid. */
function toDate(value: Date | string | null | undefined): Date | null {
  if (value == null) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** The later of two dates (for opensAt: registration opens once BOTH windows have opened). */
function latest(a: Date | null, b: Date | null): Date | null {
  if (!a) return b;
  if (!b) return a;
  return a.getTime() >= b.getTime() ? a : b;
}

/** The earlier of two dates (for closesAt: the deadline is whichever window closes FIRST). */
function earliest(a: Date | null, b: Date | null): Date | null {
  if (!a) return b;
  if (!b) return a;
  return a.getTime() <= b.getTime() ? a : b;
}

/**
 * Determines whether registration is open for the given league (and optional season).
 *
 * @param league The league being registered for.
 * @param season The season being registered for, if the form scopes to one.
 * @param now The reference time; defaults to the current time. Injectable for testing.
 */
export function isRegistrationOpen(
  league: RegistrationLeagueFields,
  season?: RegistrationSeasonFields | null,
  now: Date = new Date()
): RegistrationStatus {
  const leagueOpensAt = toDate(league.registrationOpensAt);
  const leagueClosesAt = toDate(league.registrationClosesAt);
  const seasonOpensAt = season ? toDate(season.registrationOpensAt) : null;
  const seasonClosesAt = season ? toDate(season.registrationClosesAt) : null;

  const opensAt = latest(leagueOpensAt, seasonOpensAt);
  const closesAt = earliest(leagueClosesAt, seasonClosesAt);

  if (!league.registrationOpen) {
    return { open: false, reason: 'closed', opensAt, closesAt };
  }
  if (leagueOpensAt && now < leagueOpensAt) {
    return { open: false, reason: 'league-not-yet-open', opensAt, closesAt };
  }
  if (leagueClosesAt && now > leagueClosesAt) {
    return { open: false, reason: 'league-deadline-passed', opensAt, closesAt };
  }
  if (seasonOpensAt && now < seasonOpensAt) {
    return { open: false, reason: 'season-not-yet-open', opensAt, closesAt };
  }
  if (seasonClosesAt && now > seasonClosesAt) {
    return { open: false, reason: 'season-deadline-passed', opensAt, closesAt };
  }

  return { open: true, opensAt, closesAt };
}

/** A short, user-facing message for a closed registration status. */
export function registrationClosedMessage(status: RegistrationStatus): string {
  switch (status.reason) {
    case 'league-not-yet-open':
    case 'season-not-yet-open':
      return status.opensAt
        ? `Registration opens on ${status.opensAt.toLocaleDateString()}.`
        : 'Registration is not open yet.';
    case 'league-deadline-passed':
    case 'season-deadline-passed':
      return 'The registration deadline has passed.';
    case 'closed':
    default:
      return 'Registration is currently closed.';
  }
}
