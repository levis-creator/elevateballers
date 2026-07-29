export type TeamOwnership = {
  id: string;
  teamId: string;
  userId?: string;
  email: string;
  role: string;
  verifiedAt: Date;
  revokedAt?: Date;
};

export function isActiveTeamOwnership(ownership: Pick<TeamOwnership, 'revokedAt'>, now = new Date()): boolean {
  return !ownership.revokedAt || ownership.revokedAt > now;
}
