/**
 * Player availability rules. A suspension covers the team's next `matchCount`
 * matches dated after `startsAfter` (skipping the match the player was ejected
 * from); an injury keeps the player out until someone marks them fit.
 */

/** Matches an ejection keeps the player out of. */
export const EJECTION_SUSPENSION_MATCHES = 1;

export type AvailabilityType = 'SUSPENSION' | 'INJURY';

export type AvailabilityRecord = {
  id: string;
  playerId: string;
  teamId: string | null;
  type: AvailabilityType;
  reason: string | null;
  matchCount: number | null;
  startsAfter: Date;
  sourceMatchId: string | null;
  resolvedAt: Date | null;
};

export type TeamMatch = {
  id: string;
  date: Date;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED';
  team1Id: string | null;
  team2Id: string | null;
};

const byDate = (a: TeamMatch, b: TeamMatch) => a.date.getTime() - b.date.getTime() || a.id.localeCompare(b.id);

/** The team matches a suspension covers, earliest first (fewer than `matchCount` if not yet scheduled). */
export function coveredMatches(record: AvailabilityRecord, matches: readonly TeamMatch[]): TeamMatch[] {
  if (record.type !== 'SUSPENSION' || !record.teamId) return [];
  return matches
    .filter(
      (m) =>
        (m.team1Id === record.teamId || m.team2Id === record.teamId) &&
        m.id !== record.sourceMatchId &&
        m.date.getTime() > record.startsAfter.getTime()
    )
    .sort(byDate)
    .slice(0, Math.max(0, record.matchCount ?? 0));
}

/** Suspension matches still to be served. */
export function matchesRemaining(record: AvailabilityRecord, matches: readonly TeamMatch[]): number {
  const served = coveredMatches(record, matches).filter((m) => m.status === 'COMPLETED').length;
  return Math.max(0, (record.matchCount ?? 0) - served);
}

/** Whether the record currently keeps the player out. */
export function isActive(record: AvailabilityRecord, matches: readonly TeamMatch[]): boolean {
  if (record.resolvedAt) return false;
  if (record.type === 'INJURY') return true;
  return matchesRemaining(record, matches) > 0;
}

/** Whether the record rules the player out of `match`. */
export function blocksMatch(record: AvailabilityRecord, match: TeamMatch, matches: readonly TeamMatch[]): boolean {
  if (record.resolvedAt) return false;
  if (record.type === 'INJURY') return true;
  return coveredMatches(record, matches).some((m) => m.id === match.id);
}

export type AvailabilityStatus = {
  id: string;
  type: AvailabilityType;
  reason: string | null;
  /** Suspension matches still to serve; null for injuries. */
  matchesRemaining: number | null;
  label: string;
};

export function describe(record: AvailabilityRecord, matches: readonly TeamMatch[]): AvailabilityStatus {
  if (record.type === 'INJURY')
    return { id: record.id, type: 'INJURY', reason: record.reason, matchesRemaining: null, label: 'Injured' };
  const remaining = matchesRemaining(record, matches);
  return {
    id: record.id,
    type: 'SUSPENSION',
    reason: record.reason,
    matchesRemaining: remaining,
    label: `Suspended · ${remaining} ${remaining === 1 ? 'match' : 'matches'} left`,
  };
}

/** User-facing reason a player cannot be listed, or null when available. */
export function unavailableMessage(name: string, record: AvailabilityRecord): string {
  return record.type === 'INJURY'
    ? `${name} is injured and can't be listed until they are marked fit.`
    : `${name} is suspended for this match.`;
}
