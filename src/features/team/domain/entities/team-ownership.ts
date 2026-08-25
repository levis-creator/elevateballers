export type TeamOwnership = {
  id: string;
  teamId: string;
  userId?: string;
  email: string;
  role: string;
  verifiedAt: Date;
  effectiveFrom?: Date;
  effectiveTo?: Date;
  revokedAt?: Date;
};

export function isActiveTeamOwnership(ownership: Pick<TeamOwnership, 'revokedAt' | 'effectiveFrom' | 'effectiveTo'>, now = new Date()): boolean {
  return (!ownership.revokedAt || ownership.revokedAt > now)
    && (!ownership.effectiveFrom || ownership.effectiveFrom <= now)
    && (!ownership.effectiveTo || ownership.effectiveTo > now);
}
