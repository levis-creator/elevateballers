import type {
  CreateSeasonRegistrationCommand,
  SeasonRegistrationApplication,
} from '../entities/season-registration';

export interface SeasonRegistrationRepository {
  listRoster(seasonTeamId: string, includePending?: boolean): Promise<unknown[]>;
  create(command: CreateSeasonRegistrationCommand): Promise<SeasonRegistrationApplication>;
  approve(applicationId: string, reviewerId: string): Promise<SeasonRegistrationApplication>;
  reject(applicationId: string, reviewerId: string, adminNotes?: string): Promise<SeasonRegistrationApplication>;
  requestOwnershipVerification(applicationId: string): Promise<{ token: string; expiresAt: Date }>;
  verifyOwnership(token: string): Promise<SeasonRegistrationApplication>;
  addRosterPlayer(seasonTeamId: string, playerId: string, jerseyNumber?: number, position?: string): Promise<unknown>;
  removeRosterPlayer(seasonTeamId: string, playerId: string): Promise<unknown>;
  approveRosterPlayer(rosterId: string, reviewerId: string): Promise<unknown>;
  rejectRosterPlayer(rosterId: string, reviewerId: string): Promise<unknown>;
  withdrawRosterPlayer(rosterId: string, changedById?: string): Promise<unknown>;
  requestTransfer(input: { playerId: string; fromSeasonTeamId: string; toSeasonTeamId: string; reason?: string; requestedById?: string }): Promise<unknown>;
  approveTransfer(transferId: string, reviewerId: string): Promise<unknown>;
}

export function createSeasonRegistrationUseCases(repository: SeasonRegistrationRepository) {
  return {
    listRoster: (seasonTeamId: string, includePending = false) => repository.listRoster(seasonTeamId, includePending),
    submit: (command: CreateSeasonRegistrationCommand) => repository.create(command),
    approve: (applicationId: string, reviewerId: string) => repository.approve(applicationId, reviewerId),
    reject: (applicationId: string, reviewerId: string, adminNotes?: string) => repository.reject(applicationId, reviewerId, adminNotes),
    requestOwnershipVerification: (applicationId: string) => repository.requestOwnershipVerification(applicationId),
    verifyOwnership: (token: string) => repository.verifyOwnership(token),
    addRosterPlayer: (seasonTeamId: string, playerId: string, jerseyNumber?: number, position?: string) => repository.addRosterPlayer(seasonTeamId, playerId, jerseyNumber, position),
    removeRosterPlayer: (seasonTeamId: string, playerId: string) => repository.removeRosterPlayer(seasonTeamId, playerId),
    approveRosterPlayer: (rosterId: string, reviewerId: string) => repository.approveRosterPlayer(rosterId, reviewerId),
    rejectRosterPlayer: (rosterId: string, reviewerId: string) => repository.rejectRosterPlayer(rosterId, reviewerId),
    withdrawRosterPlayer: (rosterId: string, changedById?: string) => repository.withdrawRosterPlayer(rosterId, changedById),
    requestTransfer: (input: { playerId: string; fromSeasonTeamId: string; toSeasonTeamId: string; reason?: string; requestedById?: string }) => repository.requestTransfer(input),
    approveTransfer: (transferId: string, reviewerId: string) => repository.approveTransfer(transferId, reviewerId),
  };
}
