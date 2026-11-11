/**
 * Duplicate-player detection.
 *
 * Neither a name nor an email identifies a player here: minors often register
 * with their coach's email or phone, and common names repeat across teams. So
 * records are grouped by full name, and a group is only a *likely* duplicate
 * when the records also share a phone, email, date of birth or team. Sharing
 * contact details under a different name is never a duplicate (siblings, a
 * coach's squad); it is shown as context only.
 */

import { normalizePhoneNumber } from '../../../lib/phone';

export type DuplicateCandidate = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  dateOfBirth?: Date | string | null;
  teamId?: string | null;
};

export type DuplicateReason = 'phone' | 'email' | 'dateOfBirth' | 'team';
export type DuplicateStrength = 'LIKELY' | 'NAME_ONLY';

export type DuplicateGroup = {
  key: string;
  ids: string[];
  strength: DuplicateStrength;
  reasons: DuplicateReason[];
};

export type SharedContact = { id: string; name: string; via: ('email' | 'phone')[] };

const clean = (value: string | null | undefined) =>
  (value ?? '').normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');

/** `first::last`, or null when either name is missing. Also the stored review key. */
export function playerNameKey(player: Pick<DuplicateCandidate, 'firstName' | 'lastName'>): string | null {
  const first = clean(player.firstName);
  const last = clean(player.lastName);
  return first && last ? `${first}::${last}` : null;
}

/**
 * The full international number, so 0712345678 and +254 712 345 678 match,
 * but the same digits under another country code do not. Older numbers saved
 * without a country code are read as Kenyan.
 */
export function phoneKey(phone: string | null | undefined): string | null {
  return normalizePhoneNumber(phone);
}

export function emailKey(email: string | null | undefined): string | null {
  const value = clean(email);
  return value.includes('@') ? value : null;
}

function dateKey(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

const REASON_ORDER: DuplicateReason[] = ['phone', 'email', 'dateOfBirth', 'team'];

/** What two same-name records have in common besides the name. */
export function sharedSignals(a: DuplicateCandidate, b: DuplicateCandidate): DuplicateReason[] {
  const reasons: DuplicateReason[] = [];
  const same = (x: string | null, y: string | null) => x !== null && x === y;
  if (same(phoneKey(a.phone), phoneKey(b.phone))) reasons.push('phone');
  if (same(emailKey(a.email), emailKey(b.email))) reasons.push('email');
  if (same(dateKey(a.dateOfBirth), dateKey(b.dateOfBirth))) reasons.push('dateOfBirth');
  if (same(a.teamId ?? null, b.teamId ?? null)) reasons.push('team');
  return reasons;
}

/** Groups of two or more records with the same full name, likely duplicates first. */
export function findDuplicateGroups(players: DuplicateCandidate[]): DuplicateGroup[] {
  const byName = new Map<string, DuplicateCandidate[]>();
  for (const player of players) {
    const key = playerNameKey(player);
    if (key) byName.set(key, [...(byName.get(key) ?? []), player]);
  }
  const groups: DuplicateGroup[] = [];
  for (const [key, members] of byName) {
    if (members.length < 2) continue;
    const reasons = new Set<DuplicateReason>();
    for (let i = 0; i < members.length; i += 1)
      for (let j = i + 1; j < members.length; j += 1)
        for (const reason of sharedSignals(members[i], members[j])) reasons.add(reason);
    groups.push({
      key,
      ids: members.map((member) => member.id),
      strength: reasons.size ? 'LIKELY' : 'NAME_ONLY',
      reasons: REASON_ORDER.filter((reason) => reasons.has(reason)),
    });
  }
  return groups.sort(
    (a, b) => Number(b.strength === 'LIKELY') - Number(a.strength === 'LIKELY') || a.key.localeCompare(b.key)
  );
}

/**
 * For each target, the other players (under a different name) who use the same
 * email or phone. Context for the reviewer, never a duplicate.
 */
export function findSharedContacts(
  targets: DuplicateCandidate[],
  everyone: DuplicateCandidate[]
): Map<string, SharedContact[]> {
  const byEmail = new Map<string, DuplicateCandidate[]>();
  const byPhone = new Map<string, DuplicateCandidate[]>();
  for (const player of everyone) {
    const email = emailKey(player.email);
    const phone = phoneKey(player.phone);
    if (email) byEmail.set(email, [...(byEmail.get(email) ?? []), player]);
    if (phone) byPhone.set(phone, [...(byPhone.get(phone) ?? []), player]);
  }
  const result = new Map<string, SharedContact[]>();
  for (const target of targets) {
    const name = playerNameKey(target);
    const found = new Map<string, SharedContact>();
    const add = (others: DuplicateCandidate[] | undefined, via: 'email' | 'phone') => {
      for (const other of others ?? []) {
        if (other.id === target.id || (name && playerNameKey(other) === name)) continue;
        const entry = found.get(other.id) ?? {
          id: other.id,
          name: `${other.firstName ?? ''} ${other.lastName ?? ''}`.trim() || 'Unnamed player',
          via: [],
        };
        if (!entry.via.includes(via)) entry.via.push(via);
        found.set(other.id, entry);
      }
    };
    const email = emailKey(target.email);
    const phone = phoneKey(target.phone);
    if (email) add(byEmail.get(email), 'email');
    if (phone) add(byPhone.get(phone), 'phone');
    if (found.size) result.set(target.id, [...found.values()].sort((a, b) => a.name.localeCompare(b.name)));
  }
  return result;
}
