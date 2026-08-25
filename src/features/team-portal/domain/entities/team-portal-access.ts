export type PortalTeam = { id: string; name: string };

export type TeamPortalAccess =
  | { status: 'allowed'; teams: PortalTeam[] }
  | { status: 'unauthenticated' }
  | { status: 'inactive' }
  | { status: 'not-activated' }
  | { status: 'not-team-coach' }
  | { status: 'no-active-team'; teams: PortalTeam[] };

export function resolveTeamPortalAccess(input: {
  active: boolean;
  activatedAt: Date | null;
  roles: string[];
  teams: PortalTeam[];
}): TeamPortalAccess {
  if (!input.active) return { status: 'inactive' };
  if (!input.activatedAt) return { status: 'not-activated' };
  if (!input.roles.includes('Team Coach')) return { status: 'not-team-coach' };
  if (input.teams.length === 0) return { status: 'no-active-team', teams: [] };
  return { status: 'allowed', teams: input.teams };
}

export function isSafeInternalReturnTo(value: string | null | undefined): value is string {
  return Boolean(value && value.startsWith('/') && !value.startsWith('//') && !value.includes('\\'));
}
