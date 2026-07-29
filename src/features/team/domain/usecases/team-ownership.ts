import type { TeamOwnership } from '../entities/team-ownership';

export interface TeamOwnershipRepository {
  listActive(teamId: string): Promise<TeamOwnership[]>;
  revoke(ownershipId: string): Promise<void>;
}

export function createTeamOwnershipUseCases(repository: TeamOwnershipRepository) {
  return {
    listActive: (teamId: string) => repository.listActive(teamId),
    revoke: (ownershipId: string) => repository.revoke(ownershipId),
  };
}
