import { describe, expect, it } from 'vitest';
import {
  MAX_BENCH,
  MAX_STARTERS,
  isLineupLocked,
  isTeamMatch,
  lineupDeadline,
  lineupLockReason,
  lineupLockedMessage,
  lineupSubmissionSchema,
  validateLineup,
} from './lineup';

const roster = new Set(Array.from({ length: 14 }, (_, i) => `p${i + 1}`));
const entry = (playerId: string, started = false) => ({ playerId, started });

describe('lineup rules', () => {
  it('accepts a full lineup with the maximum number of starters', () => {
    const players = ['p1', 'p2', 'p3', 'p4', 'p5'].map((id) => entry(id, true)).concat(entry('p6'));
    expect(validateLineup(players, roster)).toBeNull();
  });

  it('accepts an availability-only lineup with no starters yet', () => {
    expect(validateLineup([entry('p1'), entry('p2')], roster)).toBeNull();
  });

  it(`rejects more than ${MAX_STARTERS} starters`, () => {
    const players = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'].map((id) => entry(id, true));
    expect(validateLineup(players, roster)).toMatch(/at most 5 starters/);
  });

  it('accepts a full 12-player squad: 5 starters and 7 on the bench', () => {
    const players = Array.from({ length: 12 }, (_, i) => entry(`p${i + 1}`, i < 5));
    expect(validateLineup(players, roster)).toBeNull();
  });

  it(`rejects more than ${MAX_BENCH} players on the bench`, () => {
    const players = Array.from({ length: MAX_BENCH + 1 }, (_, i) => entry(`p${i + 1}`));
    expect(validateLineup(players, roster)).toMatch(/at most 7 players on the bench \(12 in total\)/);
  });

  it('rejects players who are not on the approved roster', () => {
    expect(validateLineup([entry('p1'), entry('stranger')], roster)).toMatch(/approved players/);
  });

  it('locks every status except UPCOMING', () => {
    const date = new Date('2026-10-10T16:00:00Z');
    const now = new Date('2026-10-01T00:00:00Z');
    expect(isLineupLocked({ status: 'UPCOMING', date }, now, 2)).toBe(false);
    expect(isLineupLocked({ status: 'LIVE', date }, now, 2)).toBe(true);
    expect(isLineupLocked({ status: 'COMPLETED', date }, now, 2)).toBe(true);
    expect(lineupLockReason({ status: 'LIVE', date }, now, 2)).toBe('STARTED');
    expect(lineupLockReason({ status: 'COMPLETED', date }, now, 2)).toBe('COMPLETED');
  });

  it('only treats matches in the team’s active league season as its own', () => {
    const match = { status: 'UPCOMING' as const, team1Id: 't1', team2Id: 't2', leagueSeasonId: 'ls1' };
    expect(isTeamMatch(match, 't1', 'ls1')).toBe(true);
    expect(isTeamMatch(match, 't2', 'ls1')).toBe(true);
    expect(isTeamMatch(match, 't3', 'ls1')).toBe(false);
    expect(isTeamMatch(match, 't1', 'other-season')).toBe(false);
  });

  it('rejects duplicate players in a submission', () => {
    const result = lineupSubmissionSchema.safeParse({
      teamId: 't1',
      matchId: 'm1',
      players: [entry('p1', true), entry('p1')],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/only be listed once/);
  });

  it('rejects out-of-range jersey numbers', () => {
    const result = lineupSubmissionSchema.safeParse({
      teamId: 't1',
      matchId: 'm1',
      players: [{ playerId: 'p1', started: true, jerseyNumber: 100 }],
    });
    expect(result.success).toBe(false);
  });
});

describe('lineup deadline', () => {
  const tipOff = new Date('2026-10-10T16:00:00Z');
  const upcoming = { status: 'UPCOMING' as const, date: tipOff };
  const at = (iso: string) => new Date(iso);

  it('closes the given number of hours before tip-off', () => {
    expect(lineupDeadline(upcoming, 2)).toEqual(at('2026-10-10T14:00:00Z'));
  });

  it('stays open until the deadline and locks from it onwards', () => {
    expect(lineupLockReason(upcoming, at('2026-10-10T13:59:59Z'), 2)).toBeNull();
    expect(lineupLockReason(upcoming, at('2026-10-10T14:00:00Z'), 2)).toBe('DEADLINE');
    expect(lineupLockReason(upcoming, at('2026-10-10T15:00:00Z'), 2)).toBe('DEADLINE');
  });

  it('locks at tip-off when the deadline is 0', () => {
    expect(lineupLockReason(upcoming, at('2026-10-10T15:59:59Z'), 0)).toBeNull();
    expect(lineupLockReason(upcoming, at('2026-10-10T16:00:00Z'), 0)).toBe('DEADLINE');
  });

  it('follows a rescheduled match date', () => {
    const now = at('2026-10-10T15:00:00Z');
    expect(lineupLockReason(upcoming, now, 2)).toBe('DEADLINE');
    expect(lineupLockReason({ ...upcoming, date: '2026-10-11T16:00:00Z' }, now, 2)).toBeNull();
  });

  it('tells the coach when lineups closed and who to contact', () => {
    expect(lineupLockedMessage('DEADLINE', 'Oct 10 · 5:00 PM')).toBe(
      'Lineups for this match closed at Oct 10 · 5:00 PM. Contact the league office to make changes.'
    );
  });
});
