// Shared queries load whole Player, Staff and User records, which include
// contact and identity details. Public API responses go through this so those
// never reach someone who is not signed in with the right permission.

export const PRIVATE_FIELDS = [
  'email',
  'phone',
  'phoneSecondary',
  'nextOfKin',
  'idNumber',
  'internalNote',
  'licenseNumber',
  'safeguardingStatus',
  'dateOfBirth',
] as const;

const PRIVATE = new Set<string>(PRIVATE_FIELDS);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/** Copy of `value` with every private field removed, at any depth. */
export function stripPrivateFields<T>(value: T): T {
  if (Array.isArray(value)) return value.map(stripPrivateFields) as T;
  if (!isPlainObject(value)) return value;
  const copy: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    if (!PRIVATE.has(key)) copy[key] = stripPrivateFields(child);
  }
  return copy as T;
}
