export interface SubSelection {
  outIds: string[];
  inIds: string[];
}

export type TapRole = 'floor' | 'bench';

export const EMPTY_SELECTION: SubSelection = { outIds: [], inIds: [] };

// Tapping a player toggles them in or out of the role's ordered list.
// Insertion order is preserved so the component can display a pairing index
// (#1 out pairs with #1 in on commit).
export function resolveSubTap(
  current: SubSelection,
  role: TapRole,
  playerId: string,
): SubSelection {
  const key = role === 'floor' ? 'outIds' : 'inIds';
  const list = current[key];
  const nextList = list.includes(playerId)
    ? list.filter((id) => id !== playerId)
    : [...list, playerId];
  return { ...current, [key]: nextList };
}

// A commit needs at least one pair and equal counts on both sides — you can't
// field fewer or more than you pulled.
export function canCommit(selection: SubSelection): boolean {
  return (
    selection.outIds.length > 0 &&
    selection.outIds.length === selection.inIds.length
  );
}

// Pair out/in by insertion order. Caller must have validated `canCommit`.
export function buildPairs(selection: SubSelection): Array<{ outId: string; inId: string }> {
  return selection.outIds.map((outId, idx) => ({
    outId,
    inId: selection.inIds[idx],
  }));
}
