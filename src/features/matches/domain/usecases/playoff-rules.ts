/**
 * Playoff match rules (pure / client-safe).
 *
 * A single source of truth for which stages count as playoffs and what a
 * playoff match must have for the bracket + standings to work. Used by both the
 * admin match form (client) and the match API (server), so the same rule is
 * enforced in both places.
 */
import type { MatchStage } from '@prisma/client';

/** Stages that make up a playoff bracket, in chronological order. */
export const PLAYOFF_STAGES: MatchStage[] = [
  'QUALIFIER',
  'PLAYOFF',
  'QUARTER_FINALS',
  'SEMI_FINALS',
  'CHAMPIONSHIP',
];

export function isPlayoffStage(stage: MatchStage | null | undefined): boolean {
  return stage != null && PLAYOFF_STAGES.includes(stage);
}

export interface PlayoffMatchFields {
  stage?: MatchStage | string | null;
  seasonId?: string | null;
  team1Id?: string | null;
  team2Id?: string | null;
}

/**
 * Validates a playoff match's compulsory fields. Returns a human-readable error
 * string when a playoff-stage match is missing a season or a real team on
 * either side, or null when the match is valid (or isn't a playoff match, in
 * which case these rules don't apply).
 *
 * Bracket advancement and the "advancing vs. eliminated" breakdown are keyed on
 * real team ids and the season, so both are required — free-typed team names are
 * not enough.
 */
export function validatePlayoffMatch(fields: PlayoffMatchFields): string | null {
  if (!isPlayoffStage(fields.stage as MatchStage | null | undefined)) return null;

  const missing: string[] = [];
  if (!fields.seasonId) missing.push('a season');
  if (!fields.team1Id) missing.push('team 1');
  if (!fields.team2Id) missing.push('team 2');

  if (missing.length === 0) return null;

  return `Playoff matches must have ${missing.join(', ')} selected (not typed names) — the bracket and standings rely on real teams and a season.`;
}
