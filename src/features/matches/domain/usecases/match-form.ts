/**
 * Pure match-form domain logic: the stage vocabulary, field validation, and the
 * "before you save" checklist. Framework-free and unit-tested; the presentation
 * hook/component only wire state to these.
 */
import type { MatchStage, MatchStatus } from '@prisma/client';
import { parseLocalDateTimeToUTC } from './match-datetime';

export const MATCH_STAGES: MatchStage[] = [
  'REGULAR_SEASON',
  'PRESEASON',
  'EXHIBITION',
  'PLAYOFF',
  'QUARTER_FINALS',
  'SEMI_FINALS',
  'CHAMPIONSHIP',
  'QUALIFIER',
  'OTHER',
];

/** Human label for a stage enum, e.g. "QUARTER_FINALS" -> "Quarter Finals". */
export function stageLabel(stage: MatchStage | string): string {
  return String(stage)
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** The subset of form fields the domain rules care about. */
export interface MatchFormData {
  team1Id: string;
  team1Name: string;
  team2Id: string;
  team2Name: string;
  leagueId: string;
  seasonId: string;
  date: string; // datetime-local value
  status: MatchStatus;
  stage: MatchStage | '';
  team1Score: string;
  team2Score: string;
  duration: string;
}

export interface MatchChecklist {
  teams: boolean;
  date: boolean;
  league: boolean;
  season: boolean;
}

/** True once a slot has either a picked team or a typed custom name. */
const hasTeam = (id: string, name: string) => Boolean(id || name.trim());

export function matchChecklist(form: MatchFormData): MatchChecklist {
  return {
    teams: hasTeam(form.team1Id, form.team1Name) && hasTeam(form.team2Id, form.team2Name),
    date: Boolean(form.date),
    league: Boolean(form.leagueId),
    season: Boolean(form.seasonId),
  };
}

/** Whether scores are editable — only meaningful once a game is live/completed. */
export function scoresUnlocked(status: MatchStatus): boolean {
  return status === 'LIVE' || status === 'COMPLETED';
}

function validScore(raw: string): boolean {
  if (!raw) return true;
  const n = Number.parseInt(raw, 10);
  return !Number.isNaN(n) && n >= 0 && n <= 999;
}

/**
 * Validate the form, returning a list of human-readable errors (empty = valid).
 * `now` is injectable so the "must be in the future" rule is testable.
 */
export function validateMatchForm(form: MatchFormData, now: Date = new Date()): string[] {
  const errors: string[] = [];
  if (!hasTeam(form.team1Id, form.team1Name)) errors.push('Home team is required');
  if (!hasTeam(form.team2Id, form.team2Name)) errors.push('Away team is required');
  if (form.team1Id && form.team1Id === form.team2Id) errors.push('Home and away team must differ');
  if (!form.leagueId) errors.push('League is required');
  if (!form.seasonId) errors.push('Season is required');
  if (!form.stage) errors.push('Match stage is required');
  if (!form.date) {
    errors.push('Date & time is required');
  } else if (form.status === 'UPCOMING') {
    const when = new Date(parseLocalDateTimeToUTC(form.date));
    if (when < now) errors.push('Upcoming matches must be scheduled in the future');
  }
  if (!validScore(form.team1Score)) errors.push('Home score must be between 0 and 999');
  if (!validScore(form.team2Score)) errors.push('Away score must be between 0 and 999');
  return errors;
}
