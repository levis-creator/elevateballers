import { describe, expect, it } from 'vitest';
import { parseImport, splitCsvLine } from './importCsv';
import { toConsoleRules } from './rules';

const ctx = {
  rules: toConsoleRules(null),
  homeId: 'h',
  awayId: 'a',
  teams: [
    { id: 'h', short: 'MAL', name: 'Malaikas' },
    { id: 'a', short: 'MASFO', name: 'Mashuuru Sports Foundation' },
  ],
  players: [
    { id: 'p7', teamId: 'h', no: 7 },
    { id: 'p9', teamId: 'a', no: 9 },
    { id: 'p11a', teamId: 'a', no: 11 },
    { id: 'p11b', teamId: 'a', no: 11 },
  ],
};

describe('parseImport — period, clock, team, jersey, action', () => {
  it('parses rows and resolves players by jersey', () => {
    const rows = parseImport('period,clock,team,jersey,action\n2, 04:12, MAL, 7, 3PT_MADE\nQ4, 0:35, masfo, -, TIMEOUT', ctx);
    expect(rows).toHaveLength(2);
    expect(rows[0].event).toMatchObject({ eventType: 'THREE_POINT_MADE', teamId: 'h', playerId: 'p7', period: 2, secondsRemaining: 252, minute: 16 });
    expect(rows[1].event).toMatchObject({ eventType: 'TIMEOUT', teamId: 'a', playerId: null, period: 4, secondsRemaining: 35 });
  });

  it('accepts OT, home/away and a detail column', () => {
    const [row] = parseImport('OT1, 2:00, away, 9, tov, bad pass', ctx);
    expect(row.event).toMatchObject({ eventType: 'TURNOVER', teamId: 'a', period: 5, description: 'bad pass' });
  });

  it('reports problems per row without dropping the rest', () => {
    const rows = parseImport(['2, 4:12, MAL, 8, 2PT_MADE', '2, 4:61, MAL, 7, 2PT_MADE', '2, 4:12, XYZ, 7, 2PT_MADE', '2, 4:12, MASFO, 11, PF', '2, 4:12, MAL, 7, DUNK', '2, 4:12, MAL, 7, PF'].join('\n'), ctx);
    expect(rows.map((r) => r.error ?? 'ok')).toEqual([
      'No #8 listed for MAL',
      'Clock "4:61" should be mm:ss',
      'Unknown team "XYZ"',
      '#11 is listed twice for MASFO',
      'Unknown action "DUNK"',
      'ok',
    ]);
  });

  it('gives identical lines different keys, and the same file the same keys', () => {
    const text = '1, 9:00, MAL, 7, FT_MADE\n1, 9:00, MAL, 7, FT_MADE';
    const a = parseImport(text, ctx).map((r) => r.event!.clientId);
    const b = parseImport(text, ctx).map((r) => r.event!.clientId);
    expect(a[0]).not.toBe(a[1]);
    expect(a).toEqual(b);
  });
});

describe('parseImport — older ID-based CSV', () => {
  it('maps header columns directly', () => {
    const [row] = parseImport('eventType,minute,period,secondsRemaining,teamId,playerId\nTWO_POINT_MADE,5,1,300,h,p7', ctx);
    expect(row.event).toMatchObject({ eventType: 'TWO_POINT_MADE', minute: 5, period: 1, secondsRemaining: 300, teamId: 'h', playerId: 'p7' });
  });
});

describe('splitCsvLine', () => {
  it('handles quoted commas', () => {
    expect(splitCsvLine('1,"a, b",c')).toEqual(['1', 'a, b', 'c']);
  });
});
