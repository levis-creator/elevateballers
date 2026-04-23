export interface SubSelection {
  outId: string;
  inId: string;
}

export type TapRole = 'floor' | 'bench';

export type TapResult =
  | { kind: 'select'; next: SubSelection }
  | { kind: 'submit'; selection: { outId: string; inId: string }; next: SubSelection };

const EMPTY: SubSelection = { outId: '', inId: '' };

// Pure state machine for the "tap out → tap in" (or reverse) substitution flow.
// Tapping the already-selected player on its own side toggles the selection off.
// Tapping the opposite side with a complementary pick already queued returns a
// `submit` intent; the component does the network call.
export function resolveSubTap(
  current: SubSelection,
  role: TapRole,
  playerId: string,
): TapResult {
  if (role === 'floor') {
    if (current.outId === playerId) {
      return { kind: 'select', next: { ...current, outId: '' } };
    }
    if (current.inId && current.inId !== playerId) {
      return {
        kind: 'submit',
        selection: { outId: playerId, inId: current.inId },
        next: EMPTY,
      };
    }
    return { kind: 'select', next: { ...current, outId: playerId } };
  }

  if (current.inId === playerId) {
    return { kind: 'select', next: { ...current, inId: '' } };
  }
  if (current.outId && current.outId !== playerId) {
    return {
      kind: 'submit',
      selection: { outId: current.outId, inId: playerId },
      next: EMPTY,
    };
  }
  return { kind: 'select', next: { ...current, inId: playerId } };
}
