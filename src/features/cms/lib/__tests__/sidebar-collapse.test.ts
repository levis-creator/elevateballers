import { describe, it, expect } from 'vitest';
import {
  isAdminMatchDetailPath,
  resolveInitialCollapsed,
} from '../sidebar-collapse';

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

describe('resolveInitialCollapsed', () => {
  it('honors a stored "true" preference everywhere', () => {
    expect(resolveInitialCollapsed('/admin', 'true')).toBe(true);
    expect(resolveInitialCollapsed('/admin/players', 'true')).toBe(true);
    expect(resolveInitialCollapsed('/admin/matches/abc', 'true')).toBe(true);
  });

  it('honors a stored "false" preference — including on match detail', () => {
    expect(resolveInitialCollapsed('/admin', 'false')).toBe(false);
    expect(resolveInitialCollapsed('/admin/matches/abc', 'false')).toBe(false);
  });

  it('auto-hides on match detail when no preference is stored', () => {
    expect(resolveInitialCollapsed('/admin/matches/abc-123', null)).toBe(true);
  });

  it('stays expanded on other routes when no preference is stored', () => {
    expect(resolveInitialCollapsed('/admin', null)).toBe(false);
    expect(resolveInitialCollapsed('/admin/matches/new', null)).toBe(false);
    expect(resolveInitialCollapsed('/admin/players', null)).toBe(false);
  });

  it('ignores malformed stored values and falls back to the route default', () => {
    expect(resolveInitialCollapsed('/admin/matches/abc', 'yes')).toBe(true);
    expect(resolveInitialCollapsed('/admin', 'yes')).toBe(false);
    expect(resolveInitialCollapsed('/admin', '')).toBe(false);
  });
});
