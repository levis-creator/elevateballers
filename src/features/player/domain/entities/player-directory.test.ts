import { describe, expect, it } from 'vitest';
import { matchesParticipation, toPlayersCsv, type PlayerDirectoryRow } from './player-directory';

const active: PlayerDirectoryRow = { id: 'p1', firstName: 'Ann', lastName: 'Otieno', approved: true, team: { name: 'Queens' } };
const dropped: PlayerDirectoryRow = {
  id: 'p2',
  firstName: 'Bea',
  lastName: 'Wanjiru',
  approved: false,
  dropout: { rosterId: 'r2', droppedOutAt: '2026-09-20T10:00:00.000Z' },
};

describe('matchesParticipation', () => {
  it('filters by league participation', () => {
    expect([active, dropped].filter((p) => matchesParticipation(p, 'all'))).toHaveLength(2);
    expect([active, dropped].filter((p) => matchesParticipation(p, 'active')).map((p) => p.id)).toEqual(['p1']);
    expect([active, dropped].filter((p) => matchesParticipation(p, 'dropped')).map((p) => p.id)).toEqual(['p2']);
  });
});

describe('toPlayersCsv', () => {
  it('writes a header and one row per player with the dropout date', () => {
    const lines = toPlayersCsv([active, dropped]).split('\n');
    expect(lines[0]).toBe('First name,Last name,Team,Position,Jersey,Approved,Dropped out');
    expect(lines[1]).toBe('Ann,Otieno,Queens,,,Yes,');
    expect(lines[2]).toBe('Bea,Wanjiru,,,,No,2026-09-20');
  });

  it('quotes separators and neutralises spreadsheet formulas', () => {
    const [, row] = toPlayersCsv([{ id: 'x', firstName: '=HYPERLINK("x")', lastName: 'Smith, Jr' }]).split('\n');
    expect(row.startsWith(`"'=HYPERLINK(""x"")","Smith, Jr"`)).toBe(true);
  });
});
