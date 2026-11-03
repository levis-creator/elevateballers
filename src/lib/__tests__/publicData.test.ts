import { describe, expect, it } from 'vitest';
import { PRIVATE_FIELDS, stripPrivateFields } from '../publicData';

describe('stripPrivateFields', () => {
  it('removes contact and identity fields from nested records', () => {
    const team = {
      id: 't1',
      name: 'Queens',
      players: [{ id: 'p1', firstName: 'Ann', email: 'ann@example.com', phone: '0700', dateOfBirth: '2009-01-01' }],
    };
    expect(stripPrivateFields(team)).toEqual({ id: 't1', name: 'Queens', players: [{ id: 'p1', firstName: 'Ann' }] });
  });

  it.each(PRIVATE_FIELDS)('removes %s', (field) => {
    expect(stripPrivateFields({ staff: { id: 's1', [field]: 'secret' } })).toEqual({ staff: { id: 's1' } });
  });

  it('strips inside event wrappers such as play-by-play changes', () => {
    const body = { changes: [{ player: { id: 'p1', email: 'a@b.c' }, assistPlayer: null }], serverTime: 'now' };
    expect(stripPrivateFields(body)).toEqual({ changes: [{ player: { id: 'p1' }, assistPlayer: null }], serverTime: 'now' });
  });

  it('keeps dates and other values intact', () => {
    const createdAt = new Date('2026-11-01T00:00:00Z');
    const result = stripPrivateFields({ createdAt, score: 0, tags: ['a'], note: null });
    expect(result.createdAt).toBe(createdAt);
    expect(result).toEqual({ createdAt, score: 0, tags: ['a'], note: null });
  });

  it('does not modify the original object', () => {
    const player = { id: 'p1', email: 'a@b.c' };
    stripPrivateFields(player);
    expect(player.email).toBe('a@b.c');
  });
});
