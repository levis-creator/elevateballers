import { describe, expect, it } from 'vitest';
import { formatMinutes, secondsPlayed, type MinutesEvent } from './minutes';
import { toConsoleRules } from './rules';

const rules = toConsoleRules({ numberOfPeriods: 4, minutesPerPeriod: 10, overtimeLength: 5 });
let seq = 0;
const sub = (eventType: 'SUBSTITUTION_IN' | 'SUBSTITUTION_OUT', playerId: string, period: number, secondsRemaining: number | null, extra: Partial<MinutesEvent> = {}): MinutesEvent => ({
  eventType, playerId, period, secondsRemaining, sequenceNumber: ++seq, ...extra,
});

describe('secondsPlayed', () => {
  it('credits starters with the whole game when nobody is subbed', () => {
    const t = secondsPlayed([{ playerId: 's', started: true }, { playerId: 'b', started: false }], [], rules);
    expect(t.get('s')).toBe(2400);
    expect(t.get('b')).toBe(0);
  });

  it('splits time at the substitution clock', () => {
    const t = secondsPlayed(
      [{ playerId: 's', started: true }, { playerId: 'b', started: false }],
      [sub('SUBSTITUTION_OUT', 's', 2, 240), sub('SUBSTITUTION_IN', 'b', 2, 240)],
      rules,
    );
    // Out with 4:00 left in Q2 → 10:00 + 6:00 played.
    expect(t.get('s')).toBe(960);
    expect(t.get('b')).toBe(2400 - 960);
  });

  it('handles a player coming back on, overtime and undone subs', () => {
    const t = secondsPlayed(
      [{ playerId: 's', started: true }],
      [
        sub('SUBSTITUTION_OUT', 's', 1, 300),
        sub('SUBSTITUTION_IN', 's', 3, 600),
        sub('SUBSTITUTION_OUT', 's', 4, 100, { isUndone: true }),
        { eventType: 'TWO_POINT_MADE', playerId: 's', period: 5, secondsRemaining: 60, sequenceNumber: ++seq },
      ],
      rules,
    );
    // Q1 first half (300) + Q3 and Q4 (1200) + full 5-minute OT (300).
    expect(t.get('s')).toBe(1800);
  });

  it('places a sub without a clock reading at the start of its period', () => {
    const t = secondsPlayed([{ playerId: 's', started: true }], [sub('SUBSTITUTION_OUT', 's', 3, null)], rules);
    expect(t.get('s')).toBe(1200);
  });
});

describe('formatMinutes', () => {
  it('rounds to whole minutes and marks unknowns', () => {
    expect(formatMinutes(959)).toBe('16');
    expect(formatMinutes(null)).toBe('—');
  });
});
