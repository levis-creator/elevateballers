import { z } from 'zod';

export const MAX_STARTERS = 5;

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
  team1Id: string | null;
  team2Id: string | null;
  leagueSeasonId: string | null;
};

/** A lineup can only be changed before tip-off; once live the console owns it. */
export const isLineupLocked = (match: Pick<LineupMatch, 'status'>) => match.status !== 'UPCOMING';

/** The match must involve the team and belong to the team's active league season. */
export const isTeamMatch = (match: LineupMatch, teamId: string, leagueSeasonId: string) =>
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
  return null;
}
