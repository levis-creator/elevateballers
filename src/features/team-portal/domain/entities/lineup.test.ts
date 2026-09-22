import { describe, expect, it } from 'vitest';
import {
  MAX_STARTERS,
  isLineupLocked,
  isTeamMatch,
  lineupSubmissionSchema,
  validateLineup,
} from './lineup';

const roster = new Set(['p1', 'p2', 'p3', 'p4', 'p5', 'p6']);
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

  it('rejects players who are not on the approved roster', () => {
    expect(validateLineup([entry('p1'), entry('stranger')], roster)).toMatch(/approved players/);
  });

  it('locks every status except UPCOMING', () => {
    expect(isLineupLocked({ status: 'UPCOMING' })).toBe(false);
    expect(isLineupLocked({ status: 'LIVE' })).toBe(true);
    expect(isLineupLocked({ status: 'COMPLETED' })).toBe(true);
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
