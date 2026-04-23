import type { Player } from '@prisma/client';
import type { MatchPlayerWithDetails } from '../../cms/types';

export interface RosterBuckets {
  onFloor: MatchPlayerWithDetails[];
  onBench: MatchPlayerWithDetails[];
  reserves: Player[];
}

export interface SubstitutionHistoryEntry {
  playerOutId: string;
}

// Classifies a team's players into on-floor / on-bench / reserves.
//
// On-floor rules, in order:
//   1. `isActive === true`        → on floor
//   2. `subOut === true`          → NOT on floor
//   3. `started` without a matching `playerOutId` in history → on floor (legacy fallback)
//
// `matchPlayersForTeam` must already be filtered to the selected team and to
// rows with a populated `player` relation.
export function deriveRoster(
  matchPlayersForTeam: MatchPlayerWithDetails[],
  teamRoster: Player[],
  substitutions: SubstitutionHistoryEntry[],
): RosterBuckets {
  const subbedOutPlayerIds = new Set(substitutions.map((s) => s.playerOutId));

  const onFloor = matchPlayersForTeam.filter((mp) => {
    if (mp.isActive) return true;
    if (mp.subOut) return false;
    if (mp.started) return !subbedOutPlayerIds.has(mp.playerId);
    return false;
  });

  const onFloorRowIds = new Set(onFloor.map((mp) => mp.id));
  const onBench = matchPlayersForTeam.filter((mp) => !onFloorRowIds.has(mp.id));

  const rosterPlayerIds = new Set(matchPlayersForTeam.map((mp) => mp.playerId));
  const reserves = teamRoster.filter((p) => !rosterPlayerIds.has(p.id));

  return { onFloor, onBench, reserves };
}
