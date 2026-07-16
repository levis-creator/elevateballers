import { describe, it, expect } from 'vitest';
import type { BoxRow } from '../../entities/match-detail-v2';
import { computeLeaders } from '../match-detail-leaders';

function row(name: string, o: Partial<BoxRow> = {}): BoxRow {
  return {
    num: '', name, starter: false, min: '—',
    pts: 0, reb: 0, ast: 0, stl: 0, tp: 0, blk: 0, pf: 0,
    ...o,
  };
}

describe('computeLeaders', () => {
  it('picks the top player per stat across both teams', () => {
    const box = {
      home: [row('Alice', { pts: 18, reb: 4, ast: 3 }), row('Bob', { pts: 12, reb: 11, ast: 2 })],
      away: [row('Cara', { pts: 9, reb: 4, ast: 7 })],
    };
    const leaders = computeLeaders(box, 'DBN', 'OUT');
    expect(leaders.find((l) => l.key === 'pts')).toMatchObject({ name: 'Alice', team: 'DBN', value: 18 });
    expect(leaders.find((l) => l.key === 'reb')).toMatchObject({ name: 'Bob', team: 'DBN', value: 11 });
    expect(leaders.find((l) => l.key === 'ast')).toMatchObject({ name: 'Cara', team: 'OUT', value: 7 });
  });

  it('skips a stat nobody recorded', () => {
    const box = { home: [row('Alice', { pts: 10 })], away: [row('Cara', { pts: 6 })] };
    const leaders = computeLeaders(box, 'DBN', 'OUT');
    expect(leaders.map((l) => l.key)).toEqual(['pts']);
  });

  it('returns nothing when there are no players', () => {
    expect(computeLeaders({ home: [], away: [] }, 'DBN', 'OUT')).toEqual([]);
  });
});
