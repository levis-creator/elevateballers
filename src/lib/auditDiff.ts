/**
 * Helpers for building "before -> after" audit-log metadata, so mutation
 * endpoints don't each reinvent equality/serialization rules for diffing.
 */

function normalize(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  return value ?? null;
}

function valuesEqual(a: unknown, b: unknown): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return true;
  if (typeof na === 'object' && typeof nb === 'object') {
    return JSON.stringify(na) === JSON.stringify(nb);
  }
  return false;
}

/**
 * Shallow diff of the given fields between two records. Only fields whose
 * normalized value actually changed are included, so audit rows stay small
 * and readable instead of repeating every untouched field.
 */
export function diffFields<A extends Record<string, any>, B extends Record<string, any> = A>(
  before: A | null | undefined,
  after: B | null | undefined,
  fields: readonly (Extract<keyof A, string> & Extract<keyof B, string>)[],
): Record<string, { from: unknown; to: unknown }> {
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const field of fields) {
    const from = before?.[field];
    const to = after?.[field];
    if (!valuesEqual(from, to)) {
      changes[field] = { from: normalize(from), to: normalize(to) };
    }
  }
  return changes;
}

/** Diff of two id sets, e.g. a role's permission ids before/after a PUT. */
export function diffIdSets(
  beforeIds: string[],
  afterIds: string[],
): { added: string[]; removed: string[] } {
  const before = new Set(beforeIds);
  const after = new Set(afterIds);
  return {
    added: afterIds.filter((id) => !before.has(id)),
    removed: beforeIds.filter((id) => !after.has(id)),
  };
}
