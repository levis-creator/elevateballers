import { describe, expect, it } from 'vitest';
import { isSafeInternalReturnTo, resolveTeamPortalAccess } from './team-portal-access';

describe('Team Portal access policy', () => {
  const base = { active: true, activatedAt: new Date(), roles: ['Team Coach'], teams: [{ id: 'team-1', name: 'Lions' }] };

  it('allows only activated Team Coaches with active teams', () => {
    expect(resolveTeamPortalAccess(base).status).toBe('allowed');
    expect(resolveTeamPortalAccess({ ...base, activatedAt: null }).status).toBe('not-activated');
    expect(resolveTeamPortalAccess({ ...base, roles: [] }).status).toBe('not-team-coach');
    expect(resolveTeamPortalAccess({ ...base, teams: [] }).status).toBe('no-active-team');
  });

  it('rejects unsafe return paths', () => {
    expect(isSafeInternalReturnTo('/team-portal?team=team-1')).toBe(true);
    expect(isSafeInternalReturnTo('//evil.example')).toBe(false);
    expect(isSafeInternalReturnTo('https://evil.example')).toBe(false);
  });
});
