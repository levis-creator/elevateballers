import { describe as suite, it, expect } from 'vitest';
import {
  blocksMatch,
  coveredMatches,
  describe,
  isActive,
  matchesRemaining,
  type AvailabilityRecord,
  type TeamMatch,
} from './availability';

const day = (n: number) => new Date(Date.UTC(2026, 9, n, 18));
const match = (id: string, n: number, status: TeamMatch['status'] = 'UPCOMING', teams = ['t1', 'x']): TeamMatch => ({
  id,
  date: day(n),
  status,
  team1Id: teams[0],
  team2Id: teams[1],
});
const suspension = (over: Partial<AvailabilityRecord> = {}): AvailabilityRecord => ({
  id: 's1',
  playerId: 'p1',
  teamId: 't1',
  type: 'SUSPENSION',
  reason: null,
  matchCount: 2,
  startsAfter: day(1),
  sourceMatchId: null,
  resolvedAt: null,
  ...over,
});

suite('player availability', () => {
  const matches = [
    match('m0', 1, 'COMPLETED'),
    match('m3', 3),
    match('other', 2, 'UPCOMING', ['a', 'b']),
    match('m2', 2, 'COMPLETED'),
    match('m4', 4),
  ];

  it("covers the team's next N matches after the start, skipping other teams' games", () => {
    expect(coveredMatches(suspension(), matches).map((m) => m.id)).toEqual(['m2', 'm3']);
  });

  it('counts completed covered matches as served', () => {
    expect(matchesRemaining(suspension(), matches)).toBe(1);
    expect(isActive(suspension(), matches)).toBe(true);
    expect(blocksMatch(suspension(), matches[1], matches)).toBe(true);
    expect(blocksMatch(suspension(), matches[4], matches)).toBe(false);
  });

  it('ends once every covered match is completed', () => {
    const done = matches.map((m) => (m.id === 'm3' ? { ...m, status: 'COMPLETED' as const } : m));
    expect(isActive(suspension(), done)).toBe(false);
    expect(describe(suspension(), done).matchesRemaining).toBe(0);
  });

  it('stays active while the covered matches are not scheduled yet', () => {
    expect(isActive(suspension({ matchCount: 5 }), matches)).toBe(true);
  });

  it('never counts the ejection match itself', () => {
    const ejected = suspension({ matchCount: 1, startsAfter: day(2), sourceMatchId: 'm2' });
    const sameDay = [...matches, match('m2b', 2, 'UPCOMING')];
    expect(coveredMatches(ejected, sameDay).map((m) => m.id)).toEqual(['m3']);
  });

  it('keeps injuries active until resolved', () => {
    const injury = suspension({ type: 'INJURY', matchCount: null });
    expect(isActive(injury, [])).toBe(true);
    expect(blocksMatch(injury, matches[4], matches)).toBe(true);
    expect(isActive({ ...injury, resolvedAt: day(3) }, [])).toBe(false);
    expect(describe(injury, []).label).toBe('Injured');
  });

  it('stops blocking when an admin lifts the suspension', () => {
    expect(blocksMatch(suspension({ resolvedAt: day(2) }), matches[1], matches)).toBe(false);
  });
});
