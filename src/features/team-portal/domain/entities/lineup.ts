import { z } from 'zod';

export const MAX_STARTERS = 5;
/** Bench spots on top of the starters: a match-day squad is at most 12 players. */
export const MAX_BENCH = 7;
export const MAX_SQUAD = MAX_STARTERS + MAX_BENCH;

export const lineupSubmissionSchema = z.object({
  teamId: z.string().min(1),
  matchId: z.string().min(1),
  players: z
    .array(
      z.object({
        playerId: z.string().min(1),
        started: z.boolean(),
        jerseyNumber: z.number().int().min(0).max(99).nullable().optional(),
      })
    )
    .max(30)
    .refine((players) => new Set(players.map((p) => p.playerId)).size === players.length, {
      message: 'Each player can only be listed once.',
    }),
});

export type LineupSubmission = z.infer<typeof lineupSubmissionSchema>;

export type LineupMatch = {
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED';
  date: Date | string;
  team1Id: string | null;
  team2Id: string | null;
  leagueSeasonId: string | null;
};

/** Hours before tip-off that coaches stop being able to submit or edit lineups. */
export const DEFAULT_LINEUP_DEADLINE_HOURS = 2;
export const MAX_LINEUP_DEADLINE_HOURS = 48;

/** When coaches stop being able to submit or change the lineup for a match. */
export const lineupDeadline = (match: Pick<LineupMatch, 'date'>, deadlineHours: number) =>
  new Date(new Date(match.date).getTime() - deadlineHours * 3_600_000);

export type LineupLockReason = 'COMPLETED' | 'STARTED' | 'DEADLINE';

/**
 * Why coaches can no longer change a lineup, or null while they still can. It
 * closes `deadlineHours` before the scheduled tip-off (0 = at tip-off); once the
 * match is live the Court Console owns it. Admins can still change it after.
 */
export function lineupLockReason(
  match: Pick<LineupMatch, 'status' | 'date'>,
  now: Date,
  deadlineHours: number
): LineupLockReason | null {
  if (match.status === 'COMPLETED') return 'COMPLETED';
  if (match.status !== 'UPCOMING') return 'STARTED';
  return now.getTime() >= lineupDeadline(match, deadlineHours).getTime() ? 'DEADLINE' : null;
}

export const isLineupLocked = (
  match: Pick<LineupMatch, 'status' | 'date'>,
  now: Date,
  deadlineHours: number
) => lineupLockReason(match, now, deadlineHours) !== null;

/** The coach-facing explanation for a locked lineup. */
export function lineupLockedMessage(reason: LineupLockReason, deadlineLabel: string): string {
  if (reason === 'COMPLETED') return 'This match is over, so its lineup can no longer be changed.';
  if (reason === 'STARTED') return 'This match has started, so its lineup can no longer be changed.';
  return `Lineups for this match closed at ${deadlineLabel}. Contact the league office to make changes.`;
}

/** The match must involve the team and belong to the team's active league season. */
export const isTeamMatch = (match: Pick<LineupMatch, 'team1Id' | 'team2Id' | 'leagueSeasonId'>, teamId: string, leagueSeasonId: string) =>
  (match.team1Id === teamId || match.team2Id === teamId) && match.leagueSeasonId === leagueSeasonId;

/** Returns a user-facing error for an invalid lineup, or null when it can be saved. */
export function validateLineup(
  players: LineupSubmission['players'],
  eligiblePlayerIds: ReadonlySet<string>
): string | null {
  if (players.some((p) => !eligiblePlayerIds.has(p.playerId)))
    return 'Only approved players on your active roster can be listed.';
  if (players.filter((p) => p.started).length > MAX_STARTERS)
    return `A lineup can have at most ${MAX_STARTERS} starters.`;
  if (players.filter((p) => !p.started).length > MAX_BENCH)
    return `A lineup can have at most ${MAX_BENCH} players on the bench (${MAX_SQUAD} in total).`;
  return null;
}

/** Two players in one match-day squad can't wear the same number. */
export function duplicateJerseyMessage(
  players: ReadonlyArray<{ name: string; jerseyNumber: number | null }>
): string | null {
  const seen = new Map<number, string>();
  for (const { name, jerseyNumber } of players) {
    if (jerseyNumber == null) continue;
    const other = seen.get(jerseyNumber);
    if (other) return `${other} and ${name} are both wearing #${jerseyNumber}.`;
    seen.set(jerseyNumber, name);
  }
  return null;
}
