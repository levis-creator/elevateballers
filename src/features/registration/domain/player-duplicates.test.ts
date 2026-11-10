import { describe, expect, it } from 'vitest';
import { findDuplicateGroups, findSharedContacts, phoneKey, playerNameKey } from './player-duplicates';

const player = (id: string, first: string, last: string, extra: Record<string, unknown> = {}) => ({
  id,
  firstName: first,
  lastName: last,
  email: null,
  phone: null,
  dateOfBirth: null,
  teamId: null,
  ...extra,
});

describe('findDuplicateGroups', () => {
  it('does not group minors who share their coach email under different names', () => {
    const coach = { email: 'coach@example.com', phone: '+254700000001', teamId: 'hawks' };
    expect(findDuplicateGroups([player('a', 'Amani', 'Kip', coach), player('b', 'Baraka', 'Kip', coach)])).toEqual([]);
  });

  it('flags the same name plus the same phone as a likely duplicate', () => {
    const groups = findDuplicateGroups([
      player('a', 'Brian', 'Otieno', { phone: '+254 712 345 678' }),
      player('b', 'brian ', 'OTIENO', { phone: '0712345678', teamId: 'eagles' }),
    ]);
    expect(groups).toEqual([{ key: 'brian::otieno', ids: ['a', 'b'], strength: 'LIKELY', reasons: ['phone'] }]);
  });

  it('keeps two different players who only share a common name as name-only', () => {
    const groups = findDuplicateGroups([
      player('a', 'Brian', 'Otieno', { phone: '0711111111', email: 'a@example.com', teamId: 'hawks' }),
      player('b', 'Brian', 'Otieno', { phone: '0722222222', email: 'b@example.com', teamId: 'eagles' }),
    ]);
    expect(groups).toEqual([{ key: 'brian::otieno', ids: ['a', 'b'], strength: 'NAME_ONLY', reasons: [] }]);
  });

  it('counts same team and same date of birth as supporting signals', () => {
    const [group] = findDuplicateGroups([
      player('a', 'Faith', 'Wanjiru', { teamId: 'hawks', dateOfBirth: new Date('2011-04-02') }),
      player('b', 'Faith', 'Wanjiru', { teamId: 'hawks', dateOfBirth: '2011-04-02T00:00:00.000Z' }),
    ]);
    expect(group.reasons).toEqual(['dateOfBirth', 'team']);
  });

  it('lists likely duplicates before name-only matches', () => {
    const groups = findDuplicateGroups([
      player('a', 'Aaron', 'Mwangi'), player('b', 'Aaron', 'Mwangi'),
      player('c', 'Zawadi', 'Njeri', { phone: '0733333333' }), player('d', 'Zawadi', 'Njeri', { phone: '0733333333' }),
    ]);
    expect(groups.map((group) => group.strength)).toEqual(['LIKELY', 'NAME_ONLY']);
  });

  it('ignores records missing a first or last name', () => {
    expect(findDuplicateGroups([player('a', 'Juma', ''), player('b', 'Juma', '')])).toEqual([]);
  });
});

describe('findSharedContacts', () => {
  it('shows other players under a different name who use the same contact', () => {
    const squad = [
      player('a', 'Amani', 'Kip', { email: 'coach@example.com', phone: '0700000001' }),
      player('b', 'Baraka', 'Kip', { email: 'Coach@Example.com' }),
      player('c', 'Chege', 'Kip', { phone: '+254700000001' }),
      player('d', 'Amani', 'Kip', { email: 'coach@example.com' }),
    ];
    expect(findSharedContacts([squad[0]], squad).get('a')).toEqual([
      { id: 'b', name: 'Baraka Kip', via: ['email'] },
      { id: 'c', name: 'Chege Kip', via: ['phone'] },
    ]);
  });
});

describe('keys', () => {
  it('matches Kenyan numbers written with or without the country code', () => {
    expect(phoneKey('+254 712-345-678')).toBe(phoneKey('0712345678'));
    expect(phoneKey('123')).toBeNull();
  });
  it('normalises spacing and case in names', () => {
    expect(playerNameKey({ firstName: '  Mary  Anne ', lastName: 'WAMBUI' })).toBe('mary anne::wambui');
  });
});
