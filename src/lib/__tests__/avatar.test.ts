import { describe, it, expect } from 'vitest';
import { avatarTint, initials } from '../avatar';

describe('avatarTint', () => {
  it('is deterministic — the same seed always yields the same colour', () => {
    expect(avatarTint('team-abc')).toBe(avatarTint('team-abc'));
  });

  it('always returns a hex colour, even for an empty seed', () => {
    expect(avatarTint('')).toMatch(/^#[0-9a-f]{6}$/i);
    expect(avatarTint('grace@example.com')).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('spreads different seeds across more than one colour', () => {
    const seeds = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    expect(new Set(seeds.map(avatarTint)).size).toBeGreaterThan(1);
  });
});

describe('initials', () => {
  it('takes up to two initials by default', () => {
    expect(initials('Nairobi City Thunder')).toBe('NC');
    expect(initials('Eagles')).toBe('E');
  });

  it('honours a max of one', () => {
    expect(initials('grace achieng', 1)).toBe('G');
  });

  it('tolerates extra whitespace', () => {
    expect(initials('  westlands  hoops ')).toBe('WH');
  });

  it('falls back to "?" for a blank name rather than rendering nothing', () => {
    expect(initials('')).toBe('?');
    expect(initials('   ')).toBe('?');
  });
});
