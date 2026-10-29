/**
 * Game-clock playing time from the event log. Starters are on court at
 * tip-off; SUBSTITUTION_OUT / SUBSTITUTION_IN events (stamped with period and
 * clock) move players off and on. Anyone still on court at the final buzzer
 * is credited to the end of the last period played.
 *
 * Unlike the wall-clock PlayerPlayingTime segments, this ignores stoppages,
 * so a full regulation game is exactly periods × period length.
 */
import { periodLength, type ConsoleRules } from './rules';

export interface MinutesPlayer {
  playerId: string;
  started: boolean;
}

export interface MinutesEvent {
  eventType: string;
  playerId: string | null;
  period: number;
  secondsRemaining: number | null;
  sequenceNumber: number;
  isUndone?: boolean;
}

/** Seconds of game time before the given clock reading. */
function elapsedAt(period: number, secondsRemaining: number | null, rules: ConsoleRules): number {
  let before = 0;
  for (let p = 1; p < period; p++) before += periodLength(p, rules);
  const len = periodLength(period, rules);
  const left = secondsRemaining == null ? len : Math.min(len, Math.max(0, secondsRemaining));
  return before + len - left;
}

/** Seconds each player was on court, keyed by playerId. */
export function secondsPlayed(
  players: MinutesPlayer[],
  events: MinutesEvent[],
  rules: ConsoleRules,
): Map<string, number> {
  const totals = new Map<string, number>(players.map((p) => [p.playerId, 0]));
  const onCourt = new Map<string, number>();
  for (const p of players) if (p.started) onCourt.set(p.playerId, 0);

  const live = events.filter((e) => !e.isUndone).sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  const lastPeriod = Math.max(rules.periods, ...live.map((e) => e.period));
  let now = 0;

  for (const e of live) {
    // Time only moves forward; an event without a clock reading counts from
    // the start of its period or the last known time, whichever is later.
    now = Math.max(now, elapsedAt(e.period, e.secondsRemaining, rules));
    if (!e.playerId) continue;
    if (e.eventType === 'SUBSTITUTION_OUT') {
      const since = onCourt.get(e.playerId);
      if (since !== undefined) {
        totals.set(e.playerId, (totals.get(e.playerId) ?? 0) + now - since);
        onCourt.delete(e.playerId);
      }
    } else if (e.eventType === 'SUBSTITUTION_IN' && !onCourt.has(e.playerId)) {
      onCourt.set(e.playerId, now);
    }
  }

  const end = elapsedAt(lastPeriod, 0, rules);
  for (const [playerId, since] of onCourt) totals.set(playerId, (totals.get(playerId) ?? 0) + Math.max(0, end - since));
  return totals;
}

/** Whole-minute display, "—" when the minutes aren't known. */
export function formatMinutes(seconds: number | null | undefined): string {
  return seconds == null ? '—' : String(Math.round(seconds / 60));
}
