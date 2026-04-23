import { describe, it, expect } from 'vitest';
import { resolveSubTap, type SubSelection } from '../subSelection';

const empty: SubSelection = { outId: '', inId: '' };

describe('resolveSubTap', () => {
  it('selects out player when floor is tapped from empty state', () => {
    const result = resolveSubTap(empty, 'floor', 'p1');
    expect(result).toEqual({ kind: 'select', next: { outId: 'p1', inId: '' } });
  });

  it('selects in player when bench is tapped from empty state', () => {
    const result = resolveSubTap(empty, 'bench', 'p2');
    expect(result).toEqual({ kind: 'select', next: { outId: '', inId: 'p2' } });
  });

  it('tapping the already-selected floor player deselects it', () => {
    const result = resolveSubTap({ outId: 'p1', inId: '' }, 'floor', 'p1');
    expect(result).toEqual({ kind: 'select', next: empty });
  });

  it('tapping the already-selected bench player deselects it', () => {
    const result = resolveSubTap({ outId: '', inId: 'p2' }, 'bench', 'p2');
    expect(result).toEqual({ kind: 'select', next: empty });
  });

  it('tapping a bench player while out is selected triggers submit', () => {
    const result = resolveSubTap({ outId: 'p1', inId: '' }, 'bench', 'p2');
    expect(result).toEqual({
      kind: 'submit',
      selection: { outId: 'p1', inId: 'p2' },
      next: empty,
    });
  });

  it('tapping a floor player while in is selected triggers submit', () => {
    const result = resolveSubTap({ outId: '', inId: 'p2' }, 'floor', 'p1');
    expect(result).toEqual({
      kind: 'submit',
      selection: { outId: 'p1', inId: 'p2' },
      next: empty,
    });
  });

  it('switching out player keeps in selection intact', () => {
    // user changes their mind about who's going out — but they only picked
    // one side so far, so this is a replacement, not a submit.
    const result = resolveSubTap({ outId: 'p1', inId: '' }, 'floor', 'p3');
    expect(result).toEqual({
      kind: 'select',
      next: { outId: 'p3', inId: '' },
    });
  });

  it('switching in player keeps out selection intact', () => {
    const result = resolveSubTap({ outId: '', inId: 'p2' }, 'bench', 'p4');
    expect(result).toEqual({
      kind: 'select',
      next: { outId: '', inId: 'p4' },
    });
  });
});
