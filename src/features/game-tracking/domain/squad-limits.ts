import { MAX_BENCH, MAX_SQUAD, MAX_STARTERS } from '@/features/team-portal/domain/entities/lineup';

/**
 * The match-day squad rules the Team Portal enforces (5 starters + 7 bench =
 * 12), applied to every other path that lists a player for a match: the Court
 * Console's player setup and substitutions that bring in someone new.
 */
export class SquadLimitError extends Error {
  name = 'SquadLimitError';
}

export type SquadRow = { playerId: string; started: boolean };

/**
 * Returns a user-facing error if putting `change` into `current` breaks the
 * squad rules, or null when it fits. `current` is the team's existing rows for
 * the match; a row for the same player is replaced, not added.
 *
 * `mode: 'join'` is for a player coming on mid-game who was not listed: only
 * the 12-player total applies, since the starter/bench split is already set.
 */
export function squadLimitError(
  current: SquadRow[],
  change: SquadRow,
  mode: 'lineup' | 'join' = 'lineup'
): string | null {
  const others = current.filter((row) => row.playerId !== change.playerId);
  if (others.length + 1 > MAX_SQUAD)
    return `A team can list at most ${MAX_SQUAD} players for a match (${MAX_STARTERS} starters and ${MAX_BENCH} on the bench).`;
  if (mode === 'join') return null;
  if (change.started && others.filter((row) => row.started).length + 1 > MAX_STARTERS)
    return `A team can have at most ${MAX_STARTERS} starters.`;
  if (!change.started && others.filter((row) => !row.started).length + 1 > MAX_BENCH)
    return `A team can have at most ${MAX_BENCH} players on the bench.`;
  return null;
}

type MatchPlayerReader = {
  matchPlayer: {
    findMany(args: {
      where: { matchId: string; teamId: string };
      select: { playerId: true; started: true };
    }): Promise<SquadRow[]>;
  };
};

/** Loads the team's squad for the match and throws SquadLimitError if `change` does not fit. */
export async function assertSquadLimits(
  db: MatchPlayerReader,
  matchId: string,
  teamId: string,
  change: SquadRow,
  mode: 'lineup' | 'join' = 'lineup'
): Promise<void> {
  const current = await db.matchPlayer.findMany({
    where: { matchId, teamId },
    select: { playerId: true, started: true },
  });
  const error = squadLimitError(current, change, mode);
  if (error) throw new SquadLimitError(error);
}
