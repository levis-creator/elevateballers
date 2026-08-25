import { getTeamPortalUserContext } from '@/features/team-portal/data/datasources/team-portal-repository';
import { resolveTeamPortalAccess, type TeamPortalAccess } from '@/features/team-portal/domain/entities/team-portal-access';

export async function getTeamPortalAccess(userId: string): Promise<TeamPortalAccess> {
  const context = await getTeamPortalUserContext(userId);
  if (!context) return { status: 'unauthenticated' };
  return resolveTeamPortalAccess(context);
}

export async function requireActiveTeamContext(userId: string, requestedTeamId?: string | null) {
  const access = await getTeamPortalAccess(userId);
  if (access.status !== 'allowed') throw new Error(`Forbidden: Team Portal access status is ${access.status}`);
  const team = requestedTeamId ? access.teams.find((item) => item.id === requestedTeamId) : access.teams[0];
  if (!team) throw new Error('Forbidden: The selected team is not assigned to this user');
  return { access, team };
}
