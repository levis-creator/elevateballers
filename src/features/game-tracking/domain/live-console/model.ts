/**
 * Event model shared by the live console UI and its derivations.
 *
 * Server events and not-yet-saved local events are normalised into
 * ConsoleEvent. Follow-up events (assist, rebound, steal) point at the event
 * that prompted them through `metadata.parentCid`, so undoing a shot also
 * undoes its assist and rebound.
 */

export type ConsoleEventType =
  | 'TWO_POINT_MADE'
  | 'TWO_POINT_MISSED'
  | 'THREE_POINT_MADE'
  | 'THREE_POINT_MISSED'
  | 'FREE_THROW_MADE'
  | 'FREE_THROW_MISSED'
  | 'ASSIST'
  | 'REBOUND_OFFENSIVE'
  | 'REBOUND_DEFENSIVE'
  | 'STEAL'
  | 'BLOCK'
  | 'TURNOVER'
  | 'FOUL_PERSONAL'
  | 'FOUL_TECHNICAL'
  | 'FOUL_FLAGRANT'
  | 'FOUL_UNSPORTSMANLIKE'
  | 'FOUL_BENCH_TECHNICAL'
  | 'FOUL_COACH_TECHNICAL'
  | 'EJECTION'
  | 'SUBSTITUTION_IN'
  | 'SUBSTITUTION_OUT'
  | 'TIMEOUT'
  | 'OTHER'
  | (string & {});

export interface ConsoleEventMeta {
  cid?: string;
  parentCid?: string;
  subtype?: string;
  teamRebound?: boolean;
  [key: string]: unknown;
}

export interface ConsoleEvent {
  /** Stable key: server id, or the client id while the event is unsaved. */
  key: string;
  id: string | null;
  cid: string | null;
  eventType: ConsoleEventType;
  teamId: string | null;
  playerId: string | null;
  period: number;
  secondsRemaining: number | null;
  sequence: number;
  description: string | null;
  metadata: ConsoleEventMeta;
  /** Saved on this device only (offline or in flight). */
  queued: boolean;
}

export const POINTS: Record<string, number> = {
  TWO_POINT_MADE: 2,
  THREE_POINT_MADE: 3,
  FREE_THROW_MADE: 1,
};

export const EVENT_LABEL: Record<string, string> = {
  TWO_POINT_MADE: 'Made 2PT',
  TWO_POINT_MISSED: 'Missed 2PT',
  THREE_POINT_MADE: 'Made 3PT',
  THREE_POINT_MISSED: 'Missed 3PT',
  FREE_THROW_MADE: 'Made FT',
  FREE_THROW_MISSED: 'Missed FT',
  ASSIST: 'Assist',
  REBOUND_OFFENSIVE: 'Off. rebound',
  REBOUND_DEFENSIVE: 'Def. rebound',
  STEAL: 'Steal',
  BLOCK: 'Block',
  TURNOVER: 'Turnover',
  FOUL_PERSONAL: 'Personal foul',
  FOUL_TECHNICAL: 'Technical foul',
  FOUL_FLAGRANT: 'Unsportsmanlike foul',
  FOUL_UNSPORTSMANLIKE: 'Unsportsmanlike foul',
  FOUL_BENCH_TECHNICAL: 'Bench technical',
  FOUL_COACH_TECHNICAL: 'Coach technical',
  EJECTION: 'Ejection',
  SUBSTITUTION_IN: 'Substitution',
  SUBSTITUTION_OUT: 'Substitution',
  TIMEOUT: 'Timeout',
  OTHER: 'Other',
};

export const TEAM_REBOUND_LABEL = 'Team rebound';

/**
 * The nine turnover kinds the console asks for (keys 1–9). A steal is a
 * turnover kind — the defender is credited with a linked STEAL event.
 */
export const TURNOVER_TYPES = [
  { value: 'STEAL', label: 'Steal', group: 'Defence' },
  { value: 'BAD_PASS', label: 'Bad pass', group: 'Passing' },
  { value: 'TRAVEL', label: 'Traveling', group: 'Ball-handling' },
  { value: 'OFFENSIVE_FOUL', label: 'Offensive foul', group: 'Foul' },
  { value: 'DOUBLE_DRIBBLE', label: 'Double dribble', group: 'Ball-handling' },
  { value: 'CARRY', label: 'Carry / palm', group: 'Ball-handling' },
  { value: 'OUT_OF_BOUNDS', label: 'Out of bounds', group: 'Violation' },
  { value: 'BACKCOURT', label: 'Backcourt', group: 'Violation' },
  { value: 'CLOCK_VIOLATION', label: 'Clock violation', group: 'Violation' },
] as const;

export type TurnoverType = (typeof TURNOVER_TYPES)[number];

/** Turnovers logged without a type, or with a legacy type too vague to place. */
export const UNTYPED_TURNOVER = { value: 'UNTYPED', label: 'Untyped' } as const;

/** Older consoles used other subtypes; fold the ones that map cleanly. */
const LEGACY_TURNOVER: Record<string, string> = {
  PASS: 'BAD_PASS',
  SHOT_CLOCK: 'CLOCK_VIOLATION',
  THREE_SECOND: 'CLOCK_VIOLATION',
  ILLEGAL_SCREEN: 'OFFENSIVE_FOUL',
};

export function turnoverKind(subtype: string | undefined | null): string {
  if (!subtype) return UNTYPED_TURNOVER.value;
  if (TURNOVER_TYPES.some((t) => t.value === subtype)) return subtype;
  return LEGACY_TURNOVER[subtype] ?? UNTYPED_TURNOVER.value;
}

export function turnoverLabel(subtype: string | undefined | null): string {
  const kind = turnoverKind(subtype);
  return TURNOVER_TYPES.find((t) => t.value === kind)?.label ?? UNTYPED_TURNOVER.label;
}

export const MADE_SHOTS = new Set(['TWO_POINT_MADE', 'THREE_POINT_MADE', 'FREE_THROW_MADE']);
export const MISSED_SHOTS = new Set(['TWO_POINT_MISSED', 'THREE_POINT_MISSED', 'FREE_THROW_MISSED']);
export const PLAYER_FOULS = new Set([
  'FOUL_PERSONAL',
  'FOUL_TECHNICAL',
  'FOUL_FLAGRANT',
  'FOUL_UNSPORTSMANLIKE',
  'EJECTION',
]);
export const INCIDENTS = new Set([
  'FOUL_TECHNICAL',
  'FOUL_FLAGRANT',
  'FOUL_UNSPORTSMANLIKE',
  'EJECTION',
  'FOUL_BENCH_TECHNICAL',
  'FOUL_COACH_TECHNICAL',
]);

interface ServerEventLike {
  id: string;
  eventType: string;
  teamId: string | null;
  playerId: string | null;
  period: number;
  secondsRemaining: number | null;
  sequenceNumber: number;
  description: string | null;
  metadata: unknown;
}

export function fromServerEvent(e: ServerEventLike): ConsoleEvent {
  const metadata =
    e.metadata && typeof e.metadata === 'object' && !Array.isArray(e.metadata)
      ? (e.metadata as ConsoleEventMeta)
      : {};
  return {
    key: e.id,
    id: e.id,
    cid: typeof metadata.cid === 'string' ? metadata.cid : null,
    eventType: e.eventType,
    teamId: e.teamId,
    playerId: e.playerId,
    period: e.period,
    secondsRemaining: e.secondsRemaining,
    sequence: e.sequenceNumber,
    description: e.description,
    metadata,
    queued: false,
  };
}

/** Chronological order: period, then sequence. Unsaved events sort last. */
export function sortEvents(events: ConsoleEvent[]): ConsoleEvent[] {
  return [...events].sort((a, b) => a.period - b.period || a.sequence - b.sequence);
}

/** Keys of an event plus every follow-up linked to it. */
export function linkedKeys(events: ConsoleEvent[], target: ConsoleEvent): Set<string> {
  const keys = new Set([target.key]);
  if (!target.cid) return keys;
  for (const e of events) {
    if (e.metadata.parentCid === target.cid) keys.add(e.key);
  }
  return keys;
}

export function isSubstitution(e: ConsoleEvent): boolean {
  return e.eventType === 'SUBSTITUTION_IN' || e.eventType === 'SUBSTITUTION_OUT';
}

/**
 * The event "undo last" removes: a follow-up undoes its parent. Returns null
 * when the latest event is a substitution, which can't be undone in place.
 */
export function lastUndoable(events: ConsoleEvent[]): ConsoleEvent | null {
  const last = events[events.length - 1];
  if (!last || isSubstitution(last)) return null;
  if (last.metadata.parentCid) {
    const parent = events.find((x) => x.cid === last.metadata.parentCid);
    if (parent) return parent;
  }
  return last;
}
