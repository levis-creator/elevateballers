/**
 * Deterministic avatar helpers, shared by every admin v2 module (leagues,
 * subscribers, messages…). Pure — no framework, no I/O.
 *
 * The tint is derived from a stable seed (an id, an email, a name) so the same
 * entity always renders in the same colour, across reloads and across screens.
 */

const TINTS = ['#e4002b', '#2a6fdb', '#1f8a5b', '#d98324', '#7c5cff', '#c026a6'] as const;

export function avatarTint(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return TINTS[hash % TINTS.length];
}

/**
 * Up to `max` leading initials — "Nairobi City Thunder" → "NC", and with
 * `max: 1`, "grace@mail.com" → "G". Falls back to "?" for a blank name.
 */
export function initials(name: string, max = 2): string {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, max)
    .map((word) => word[0]!.toUpperCase())
    .join('');

  return letters || '?';
}
