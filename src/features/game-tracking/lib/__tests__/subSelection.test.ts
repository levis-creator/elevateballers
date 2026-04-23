import { describe, it, expect } from 'vitest';
import {
  resolveSubTap,
  canCommit,
  buildPairs,
  EMPTY_SELECTION,
  type SubSelection,
} from '../subSelection';

describe('resolveSubTap', () => {
  it('adds a floor tap to outIds when empty', () => {
    expect(resolveSubTap(EMPTY_SELECTION, 'floor', 'p1')).toEqual({
      outIds: ['p1'],
      inIds: [],
    });
  });

  it('adds a bench tap to inIds when empty', () => {
    expect(resolveSubTap(EMPTY_SELECTION, 'bench', 'p2')).toEqual({
      outIds: [],
      inIds: ['p2'],
    });
  });

  it('tapping an already-selected floor player toggles them off', () => {
    const start: SubSelection = { outIds: ['p1'], inIds: [] };
    expect(resolveSubTap(start, 'floor', 'p1')).toEqual(EMPTY_SELECTION);
  });

  it('tapping an already-selected bench player toggles them off', () => {
    const start: SubSelection = { outIds: [], inIds: ['p2'] };
    expect(resolveSubTap(start, 'bench', 'p2')).toEqual(EMPTY_SELECTION);
  });

  it('preserves insertion order when multi-selecting on floor', () => {
    let s: SubSelection = EMPTY_SELECTION;
    s = resolveSubTap(s, 'floor', 'p1');
    s = resolveSubTap(s, 'floor', 'p3');
    s = resolveSubTap(s, 'floor', 'p2');
    expect(s.outIds).toEqual(['p1', 'p3', 'p2']);
  });

  it('preserves insertion order when multi-selecting on bench', () => {
    let s: SubSelection = EMPTY_SELECTION;
    s = resolveSubTap(s, 'bench', 'pA');
    s = resolveSubTap(s, 'bench', 'pB');
    expect(s.inIds).toEqual(['pA', 'pB']);
  });

  it('toggling a mid-list selection leaves order of others intact', () => {
    const start: SubSelection = { outIds: ['p1', 'p2', 'p3'], inIds: [] };
    expect(resolveSubTap(start, 'floor', 'p2')).toEqual({
      outIds: ['p1', 'p3'],
      inIds: [],
    });
  });

  it('floor and bench lists are independent', () => {
    let s: SubSelection = EMPTY_SELECTION;
    s = resolveSubTap(s, 'floor', 'p1');
    s = resolveSubTap(s, 'bench', 'p1');
    // same id on both sides is allowed at the selection layer; the UI/submit
    // step is responsible for rejecting a self-swap.
    expect(s).toEqual({ outIds: ['p1'], inIds: ['p1'] });
  });
});

describe('canCommit', () => {
  it('is false when both lists are empty', () => {
    expect(canCommit(EMPTY_SELECTION)).toBe(false);
  });

  it('is false when only one side has picks', () => {
    expect(canCommit({ outIds: ['p1'], inIds: [] })).toBe(false);
    expect(canCommit({ outIds: [], inIds: ['p2'] })).toBe(false);
  });

  it('is false when counts differ', () => {
    expect(canCommit({ outIds: ['p1', 'p2'], inIds: ['p3'] })).toBe(false);
    expect(canCommit({ outIds: ['p1'], inIds: ['p3', 'p4'] })).toBe(false);
  });

  it('is true when counts match and are nonzero', () => {
    expect(canCommit({ outIds: ['p1'], inIds: ['p3'] })).toBe(true);
    expect(canCommit({ outIds: ['p1', 'p2', 'p3'], inIds: ['p4', 'p5', 'p6'] })).toBe(
      true,
    );
  });
});

describe('buildPairs', () => {
  it('pairs by insertion order', () => {
    const selection: SubSelection = {
      outIds: ['p1', 'p2', 'p3'],
      inIds: ['p4', 'p5', 'p6'],
    };
    expect(buildPairs(selection)).toEqual([
      { outId: 'p1', inId: 'p4' },
      { outId: 'p2', inId: 'p5' },
      { outId: 'p3', inId: 'p6' },
    ]);
  });

  it('returns an empty array for an empty selection', () => {
    expect(buildPairs(EMPTY_SELECTION)).toEqual([]);
  });
});
