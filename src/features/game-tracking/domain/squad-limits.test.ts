import { describe, expect, it, vi } from 'vitest';
import { assertSquadLimits, squadLimitError, SquadLimitError, type SquadRow } from './squad-limits';

const squad = (starters: number, bench: number): SquadRow[] => [
  ...Array.from({ length: starters }, (_, i) => ({ playerId: `s${i}`, started: true })),
  ...Array.from({ length: bench }, (_, i) => ({ playerId: `b${i}`, started: false })),
];

describe('squadLimitError', () => {
  it('allows the 12th player', () => {
    expect(squadLimitError(squad(5, 6), { playerId: 'new', started: false })).toBeNull();
  });

  it('rejects a 13th player', () => {
    expect(squadLimitError(squad(5, 7), { playerId: 'new', started: false })).toMatch(/at most 12 players/);
  });

  it('rejects a 6th starter', () => {
    expect(squadLimitError(squad(5, 2), { playerId: 'new', started: true })).toMatch(/at most 5 starters/);
  });

  it('rejects an 8th bench player', () => {
    expect(squadLimitError(squad(3, 7), { playerId: 'new', started: false })).toMatch(/at most 7 players on the bench/);
  });

  it('treats a change to a listed player as a replacement, not an addition', () => {
    // A full squad can still swap a bench player into the starting five if a starter spot is free.
    expect(squadLimitError(squad(4, 8).slice(0, 12), { playerId: 'b0', started: true })).toBeNull();
    expect(squadLimitError(squad(5, 7), { playerId: 's0', started: true })).toBeNull();
  });

  it('only applies the 12-player total to a mid-game join', () => {
    expect(squadLimitError(squad(3, 7), { playerId: 'new', started: false }, 'join')).toBeNull();
    expect(squadLimitError(squad(5, 7), { playerId: 'new', started: false }, 'join')).toMatch(/at most 12/);
  });
});

describe('assertSquadLimits', () => {
  it('reads the team squad and throws SquadLimitError when the change does not fit', async () => {
    const findMany = vi.fn().mockResolvedValue(squad(5, 7));
    await expect(
      assertSquadLimits({ matchPlayer: { findMany } } as any, 'm1', 't1', { playerId: 'new', started: false })
    ).rejects.toBeInstanceOf(SquadLimitError);
    expect(findMany).toHaveBeenCalledWith({
      where: { matchId: 'm1', teamId: 't1' },
      select: { playerId: true, started: true },
    });
  });
});
