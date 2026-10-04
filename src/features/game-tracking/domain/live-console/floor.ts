/**
 * Keeps each on-floor player in the same keyboard slot (Q–T / Y–U) across
 * substitutions: a player coming on takes the slot of the player going off.
 */
export function reconcileSlots(previous: string[], onFloor: string[]): string[] {
  const floorSet = new Set(onFloor);
  const slots: Array<string | null> = previous.map((id) => (floorSet.has(id) ? id : null));
  const placed = new Set(slots.filter((id): id is string => id !== null));
  const incoming = onFloor.filter((id) => !placed.has(id));
  for (let i = 0; i < slots.length && incoming.length; i++) {
    if (slots[i] === null) slots[i] = incoming.shift()!;
  }
  return [...slots.filter((id): id is string => id !== null), ...incoming];
}

/** Applies substitution pairs to an on-floor list, keeping slot positions. */
export function applySwaps(
  onFloor: string[],
  pairs: Array<{ playerOutId: string; playerInId: string }>,
): string[] {
  const next = [...onFloor];
  for (const { playerOutId, playerInId } of pairs) {
    const i = next.indexOf(playerOutId);
    if (i >= 0 && !next.includes(playerInId)) next[i] = playerInId;
  }
  return next;
}
