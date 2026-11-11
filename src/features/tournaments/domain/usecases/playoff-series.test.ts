import { describe, expect, it } from 'vitest';
import { buildPlayoffBracket, initialsOf, type PlayoffGameInput } from './playoff-series';

const team = (id: string, name: string) => ({ id, name, short: name });
const T = {
  JAS: team('jas', 'Jasiri Basketball Club'),
  OPB: team('opb', 'Outreach Parklands Baptist Church'),
  KOB: team('kob', 'Karen Oilers Basketball'),
  KSB: team('ksb', 'Kenya Science Basketball'),
  DBN: team('dbn', 'Don Bosco Nets'),
  DOT: team('dot', 'Dothrakis Stallions'),
  VBC: team('vbc', 'Vortex Basketball Club'),
  FSO: team('fso', 'Fun Society Basketball'),
  MAS: team('mas', 'Mashuuru Sports Foundation (MASFO)'),
  DYN: team('dyn', 'Dynamites'),
  MAL: team('mal', 'Malaikas'),
  CBA: team('cba', 'CBA Jets'),
};
let n = 0;
const game = (stage: string, date: string, t1: keyof typeof T, s1: number | null, s2: number | null, t2: keyof typeof T): PlayoffGameInput => ({
  id: `g${(n += 1)}`,
  stage,
  date: `${date}T14:00:00.000Z`,
  status: s1 == null ? 'UPCOMING' : 'COMPLETED',
  team1: T[t1],
  team2: T[t2],
  team1Score: s1,
  team2Score: s2,
});

// The 2026 EBL playoff games as stored in production on 2026-11-11.
const EBL_2026 = [
  game('QUARTER_FINALS', '2026-10-11', 'JAS', 88, 61, 'OPB'),
  game('QUARTER_FINALS', '2026-10-11', 'DBN', 55, 60, 'DOT'),
  game('QUARTER_FINALS', '2026-10-11', 'KSB', 45, 65, 'KOB'),
  game('QUARTER_FINALS', '2026-10-11', 'VBC', 57, 64, 'FSO'),
  game('QUARTER_FINALS', '2026-10-18', 'KOB', 57, 71, 'KSB'),
  game('QUARTER_FINALS', '2026-10-18', 'OPB', 50, 98, 'JAS'),
  game('QUARTER_FINALS', '2026-10-18', 'FSO', 67, 73, 'VBC'),
  game('QUARTER_FINALS', '2026-10-18', 'DOT', 55, 67, 'DBN'),
  game('QUARTER_FINALS', '2026-10-25', 'KSB', 58, 73, 'KOB'),
  game('QUARTER_FINALS', '2026-10-25', 'DBN', 73, 64, 'DOT'),
  game('QUARTER_FINALS', '2026-10-25', 'VBC', 80, 77, 'FSO'),
  game('SEMI_FINALS', '2026-11-01', 'JAS', 90, 50, 'KOB'),
  game('SEMI_FINALS', '2026-11-01', 'VBC', 69, 78, 'DBN'),
  game('SEMI_FINALS', '2026-11-08', 'KOB', null, null, 'JAS'),
  game('SEMI_FINALS', '2026-11-08', 'DBN', null, null, 'VBC'),
  game('SEMI_FINALS', '2026-11-15', 'VBC', null, null, 'DBN'),
];

const names = (s: { a: { id: string } | null; b: { id: string } | null }) => [s.a?.id ?? null, s.b?.id ?? null];

describe('buildPlayoffBracket — 2026 EBL', () => {
  const { rounds } = buildPlayoffBracket(EBL_2026);
  const [qf, sf, final] = rounds;

  it('groups games into best-of-3 series and adds the unscheduled Final', () => {
    expect(rounds.map((r) => [r.label, r.bestOf, r.series.length])).toEqual([
      ['Quarter-finals', 3, 4],
      ['Semi-finals', 3, 2],
      ['Final', 3, 1],
    ]);
  });

  it('orders the quarter-finals so each pair feeds its semi-final', () => {
    expect(sf.series.map(names)).toEqual([['jas', 'kob'], ['vbc', 'dbn']]);
    expect(qf.series.map((s) => [s.id, s.winner && s[s.winner]!.id, s.next])).toEqual([
      ['QF1', 'jas', 'SF1'],
      ['QF2', 'kob', 'SF1'],
      ['QF3', 'vbc', 'SF2'],
      ['QF4', 'dbn', 'SF2'],
    ]);
  });

  it('scores each series from the right side', () => {
    const jas = qf.series[0];
    expect([jas.wa, jas.wb, jas.done]).toEqual([2, 0, true]);
    const kob = qf.series[1];
    expect(kob.done).toBe(true);
    expect(kob[kob.winner!]!.id).toBe('kob');
    expect(kob.games).toHaveLength(3);
  });

  it('keeps upcoming games in an open series', () => {
    const sf2 = sf.series[1];
    expect([sf2.id, sf2.wa, sf2.wb, sf2.done]).toEqual(['SF2', 0, 1, false]);
    expect(sf2.games.map((g) => g.played)).toEqual([true, false, false]);
  });

  it('leaves the Final waiting on both semi-finals', () => {
    expect(final.series[0]).toMatchObject({ id: 'Final', a: null, b: null, aFrom: 'SF1', bFrom: 'SF2' });
  });
});

describe('buildPlayoffBracket — 2026 EWBL', () => {
  const { rounds } = buildPlayoffBracket([
    game('SEMI_FINALS', '2026-11-01', 'MAS', 20, 0, 'DYN'),
    game('SEMI_FINALS', '2026-11-01', 'MAL', 20, 0, 'CBA'),
  ]);

  it('fills the Final with both semi-final winners', () => {
    expect(rounds.map((r) => [r.label, r.bestOf])).toEqual([['Semi-finals', 1], ['Final', 1]]);
    expect(names(rounds[1].series[0])).toEqual(['mas', 'mal']);
    expect(rounds[1].series[0].aFrom).toBeUndefined();
  });
});

describe('buildPlayoffBracket — edge cases', () => {
  it('drops games still scheduled after a series is decided', () => {
    const { rounds } = buildPlayoffBracket([
      game('CHAMPIONSHIP', '2026-11-01', 'JAS', 80, 70, 'DBN'),
      game('CHAMPIONSHIP', '2026-11-08', 'DBN', 60, 70, 'JAS'),
      game('CHAMPIONSHIP', '2026-11-15', 'JAS', null, null, 'DBN'),
    ]);
    expect(rounds[0].series[0]).toMatchObject({ id: 'Final', done: true, winner: 'a' });
    expect(rounds[0].series[0].games).toHaveLength(2);
  });

  it('returns no rounds without playoff games', () => {
    expect(buildPlayoffBracket([]).rounds).toEqual([]);
  });

  it('makes two-letter initials, ignoring bracketed nicknames', () => {
    expect(initialsOf('Mashuuru Sports Foundation (MASFO)')).toBe('MS');
    expect(initialsOf('Malaikas')).toBe('M');
  });
});
