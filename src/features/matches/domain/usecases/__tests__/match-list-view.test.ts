import { describe, it, expect } from 'vitest';
import type { Match } from '../../../../cms/types';
import {
  toStatusKey,
  statusMeta,
  computeStats,
  groupByDate,
  sortByDate,
  formatMatchTime,
  avatarTint,
  matchesQuery,
} from '../match-list-view';

// UTC keeps day boundaries predictable in the assertions below.
const TZ = 'UTC';

function match(overrides: Partial<Match> & { id: string }): Match {
  return {
    id: overrides.id,
    date: overrides.date ?? new Date('2026-02-23T12:00:00Z'),
    status: overrides.status ?? 'UPCOMING',
    team1Name: overrides.team1Name ?? null,
    team2Name: overrides.team2Name ?? null,
    ...overrides,
  } as unknown as Match;
}

describe('toStatusKey', () => {
  it('normalises known statuses case-insensitively', () => {
    expect(toStatusKey('live')).toBe('LIVE');
    expect(toStatusKey('Completed')).toBe('COMPLETED');
    expect(toStatusKey('UPCOMING')).toBe('UPCOMING');
  });

  it('defaults unknown / nullish to UPCOMING', () => {
    expect(toStatusKey(undefined)).toBe('UPCOMING');
    expect(toStatusKey('archived')).toBe('UPCOMING');
  });
});

describe('statusMeta', () => {
  it('gives completed matches no console action', () => {
    expect(statusMeta('COMPLETED').consoleLabel).toBeNull();
  });
  it('gives live and upcoming a console label', () => {
    expect(statusMeta('LIVE').consoleLabel).toBe('Live Console');
    expect(statusMeta('UPCOMING').consoleLabel).toBe('Score Console');
  });
});

describe('computeStats', () => {
  it('tallies by status', () => {
    const stats = computeStats([
      match({ id: '1', status: 'COMPLETED' }),
      match({ id: '2', status: 'COMPLETED' }),
      match({ id: '3', status: 'LIVE' }),
      match({ id: '4', status: 'UPCOMING' }),
    ]);
    expect(stats).toEqual({ total: 4, completed: 2, live: 1, scheduled: 1 });
  });

  it('is empty-safe', () => {
    expect(computeStats([])).toEqual({ total: 0, completed: 0, live: 0, scheduled: 0 });
  });
});

describe('sortByDate', () => {
  const a = match({ id: 'a', date: new Date('2026-02-23T12:00:00Z') });
  const b = match({ id: 'b', date: new Date('2026-03-05T12:00:00Z') });
  const undated = match({ id: 'u', date: new Date('not-a-date') });

  it('orders newest-first by default and keeps undated last', () => {
    expect(sortByDate([a, undated, b]).map((m) => m.id)).toEqual(['b', 'a', 'u']);
  });
  it('orders oldest-first when asked, still keeping undated last', () => {
    expect(sortByDate([b, undated, a], 'asc').map((m) => m.id)).toEqual(['a', 'b', 'u']);
  });
  it('does not mutate the input', () => {
    const input = [a, b];
    sortByDate(input);
    expect(input.map((m) => m.id)).toEqual(['a', 'b']);
  });
});

describe('groupByDate', () => {
  it('groups by calendar day, newest-first by default', () => {
    const groups = groupByDate(
      [
        match({ id: 'b', date: new Date('2026-03-05T09:00:00Z') }),
        match({ id: 'a1', date: new Date('2026-02-23T18:00:00Z') }),
        match({ id: 'a2', date: new Date('2026-02-23T06:00:00Z') }),
      ],
      TZ,
    );
    expect(groups.map((g) => g.key)).toEqual(['2026-03-05', '2026-02-23']);
    expect(groups[1].matches).toHaveLength(2);
    expect(groups[1].label).toBe('Feb 23, 2026');
  });

  it('can group oldest-first when asked', () => {
    const groups = groupByDate(
      [
        match({ id: 'b', date: new Date('2026-03-05T09:00:00Z') }),
        match({ id: 'a', date: new Date('2026-02-23T18:00:00Z') }),
      ],
      TZ,
      'asc',
    );
    expect(groups.map((g) => g.key)).toEqual(['2026-02-23', '2026-03-05']);
  });

  it('pushes undated matches to a trailing bucket instead of dropping them', () => {
    const groups = groupByDate(
      [
        match({ id: 'good', date: new Date('2026-02-23T12:00:00Z') }),
        match({ id: 'bad', date: new Date('not-a-date') }),
      ],
      TZ,
    );
    expect(groups[groups.length - 1].key).toBe('unscheduled');
    expect(groups[groups.length - 1].matches[0].id).toBe('bad');
  });
});

describe('formatMatchTime', () => {
  it('formats valid times and guards invalid ones', () => {
    expect(formatMatchTime(new Date('2026-02-23T12:00:00Z'), TZ)).toBe('12:00 PM');
    expect(formatMatchTime('not-a-date', TZ)).toBe('TBD');
  });
});

describe('avatarTint', () => {
  it('is deterministic for the same name', () => {
    expect(avatarTint('Wolf Pack')).toBe(avatarTint('Wolf Pack'));
  });
  it('returns a hex from the palette', () => {
    expect(avatarTint('Eagle Warriors')).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

describe('matchesQuery', () => {
  const m = match({ id: '1', team1Name: 'Eagle Warriors', team2Name: 'Wolf Pack' });
  it('matches team names case-insensitively', () => {
    expect(matchesQuery(m, 'wolf')).toBe(true);
    expect(matchesQuery(m, 'EAGLE')).toBe(true);
  });
  it('returns true for empty query and false for a miss', () => {
    expect(matchesQuery(m, '   ')).toBe(true);
    expect(matchesQuery(m, 'lions')).toBe(false);
  });
});
