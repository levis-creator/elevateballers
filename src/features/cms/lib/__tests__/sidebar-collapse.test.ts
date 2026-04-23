import { describe, it, expect } from 'vitest';
import { isAdminMatchDetailPath } from '../sidebar-collapse';

describe('isAdminMatchDetailPath', () => {
  it('returns true for UUID-style match detail routes', () => {
    expect(isAdminMatchDetailPath('/admin/matches/abc-123-def')).toBe(true);
    expect(isAdminMatchDetailPath('/admin/matches/550e8400-e29b-41d4')).toBe(true);
  });

  it('matches with trailing slash', () => {
    expect(isAdminMatchDetailPath('/admin/matches/abc-123/')).toBe(true);
  });

  it('excludes the create route', () => {
    expect(isAdminMatchDetailPath('/admin/matches/new')).toBe(false);
    expect(isAdminMatchDetailPath('/admin/matches/new/')).toBe(false);
  });

  it('excludes the list route', () => {
    expect(isAdminMatchDetailPath('/admin/matches')).toBe(false);
    expect(isAdminMatchDetailPath('/admin/matches/')).toBe(false);
  });

  it('excludes deeper sub-routes', () => {
    expect(isAdminMatchDetailPath('/admin/matches/abc-123/events')).toBe(false);
  });

  it('excludes unrelated admin routes', () => {
    expect(isAdminMatchDetailPath('/admin')).toBe(false);
    expect(isAdminMatchDetailPath('/admin/players/abc-123')).toBe(false);
  });

  it('excludes the public match detail page', () => {
    expect(isAdminMatchDetailPath('/matches/abc-123')).toBe(false);
  });
});
