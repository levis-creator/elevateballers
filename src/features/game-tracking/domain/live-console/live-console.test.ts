import { describe, expect, it } from 'vitest';
import { toConsoleRules, timeoutWindow, periodLabel, periodLength } from './rules';
import { derive, disqualification, emptyLine, lineOf, teamFoulsNow } from './derive';
import { lastUndoable, linkedKeys, turnoverKind, type ConsoleEvent } from './model';
import { applySwaps, reconcileSlots } from './floor';

const H = 'home';
const A = 'away';
let seq = 0;
const ev = (o: Partial<ConsoleEvent> & { eventType: string }): ConsoleEvent => {
  seq += 1;
  const key = o.key ?? `e${seq}`;
  return {
    key,
    id: key,
    cid: o.cid ?? null,
    teamId: H,
    playerId: null,
    period: 1,
    secondsRemaining: 300,
    sequence: seq,
    description: null,
    metadata: {},
    queued: false,
    ...o,
  };
};

describe('toConsoleRules', () => {
  it('reads GameRules and fills FIBA constants', () => {
    const r = toConsoleRules({ numberOfPeriods: 4, minutesPerPeriod: 8, overtimeLength: 3, timeoutsPerOvertime: 2, foulsForBonus: 4 });
    expect(r.periodMin).toBe(8);
    expect(r.timeoutsFirstHalf).toBe(2);
    expect(r.timeoutsSecondHalf).toBe(3);
    expect(r.timeoutsPerOT).toBe(2);
    expect(r.foulsForBonus).toBe(4);
    expect(r.teamFoulsCarryIntoOT).toBe(true);
  });

  it('labels overtime and sizes periods', () => {
    const r = toConsoleRules(null);
    expect(periodLabel(5, r)).toBe('OT1');
    expect(periodLength(2, r)).toBe(600);
    expect(periodLength(5, r)).toBe(300);
  });

  it('splits timeouts by half and overtime', () => {
    const r = toConsoleRules(null);
    expect(timeoutWindow(1, r).cap).toBe(2);
    expect(timeoutWindow(3, r).cap).toBe(3);
    expect(timeoutWindow(3, r).inWindow(2)).toBe(false);
    expect(timeoutWindow(3, r).inWindow(4)).toBe(true);
    expect(timeoutWindow(6, r).inWindow(5)).toBe(false);
  });
});

describe('derive', () => {
  it('builds stat lines, score and running score', () => {
    const events = [
      ev({ key: 'a', eventType: 'THREE_POINT_MADE', playerId: 'p1' }),
      ev({ key: 'b', eventType: 'ASSIST', playerId: 'p2' }),
      ev({ key: 'c', eventType: 'TWO_POINT_MADE', teamId: A, playerId: 'q1', period: 2 }),
      ev({ key: 'd', eventType: 'FREE_THROW_MISSED', playerId: 'p1' }),
    ];
    const d = derive(events, H, A);
    expect(lineOf(d, 'p1')).toMatchObject({ pts: 3, tpm: 1, fga: 1, fta: 1 });
    expect(lineOf(d, 'p2').ast).toBe(1);
    expect(d.teams.get(H)!.score).toBe(3);
    expect(d.teams.get(A)!.byPeriod[2]).toBe(2);
    expect(d.scoreAt.get('c')).toBe('3–2');
    expect(d.scoreAt.has('d')).toBe(false);
  });

  it('counts team fouls per period and carries Q4 into overtime', () => {
    const r = toConsoleRules(null);
    const events = [
      ev({ eventType: 'FOUL_PERSONAL', playerId: 'p1', period: 4 }),
      ev({ eventType: 'FOUL_PERSONAL', playerId: 'p2', period: 4 }),
      ev({ eventType: 'FOUL_BENCH_TECHNICAL', period: 5 }),
      ev({ eventType: 'FOUL_PERSONAL', playerId: 'p3', period: 5 }),
    ];
    const t = derive(events, H, A).teams.get(H)!;
    expect(teamFoulsNow(t, 4, r)).toBe(2);
    expect(teamFoulsNow(t, 5, r)).toBe(3);
    expect(t.benchTechs).toBe(1);
  });

  it('groups turnovers by kind, folding legacy subtypes', () => {
    const events = [
      ev({ eventType: 'TURNOVER', playerId: 'p1', metadata: { subtype: 'TRAVEL' } }),
      ev({ eventType: 'TURNOVER', playerId: 'p1', metadata: { subtype: 'CARRY' } }),
      ev({ eventType: 'TURNOVER', playerId: 'p1' }),
    ];
    const t = derive(events, H, A).teams.get(H)!;
    expect(t.turnoversByKind).toEqual({ TRAVEL: 1, VIOLATION: 1, OTHER: 1 });
    expect(turnoverKind('PASS')).toBe('BAD_PASS');
  });
});

describe('disqualification', () => {
  const r = toConsoleRules(null);
  it.each([
    [{ pf: 5 }, 'Fouled out'],
    [{ pf: 3, tf: 1, uf: 1 }, 'DQ · T + U'],
    [{ tf: 2 }, 'DQ · 2 T'],
    [{ uf: 2 }, 'DQ · 2 U'],
    [{ ej: 1 }, 'Ejected'],
    [{ pf: 4 }, null],
  ])('%o → %s', (fouls, expected) => {
    expect(disqualification({ ...emptyLine(), ...fouls }, r)).toBe(expected);
  });
});

describe('undo helpers', () => {
  it('undoes a follow-up through its parent, with linked events', () => {
    const shot = ev({ key: 's', cid: 'c1', eventType: 'TWO_POINT_MADE', playerId: 'p1' });
    const ast = ev({ key: 'x', eventType: 'ASSIST', playerId: 'p2', metadata: { parentCid: 'c1' } });
    const events = [shot, ast];
    expect(lastUndoable(events)).toBe(shot);
    expect([...linkedKeys(events, shot)]).toEqual(['s', 'x']);
  });

  it('refuses to undo a substitution', () => {
    expect(lastUndoable([ev({ eventType: 'SUBSTITUTION_IN', playerId: 'p1' })])).toBeNull();
  });
});

describe('floor slots', () => {
  it('puts the incoming player in the outgoing slot', () => {
    expect(reconcileSlots(['a', 'b', 'c'], ['a', 'c', 'd'])).toEqual(['a', 'd', 'c']);
    expect(applySwaps(['a', 'b', 'c'], [{ playerOutId: 'b', playerInId: 'z' }])).toEqual(['a', 'z', 'c']);
  });
});
