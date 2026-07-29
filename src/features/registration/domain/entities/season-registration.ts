export type SeasonRegistrationType = 'NEW_TEAM' | 'RETURNING_TEAM';
export type SeasonRegistrationStatus = 'PENDING' | 'OWNERSHIP_VERIFICATION' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';
export type RosterChangeAction = 'ADD' | 'REMOVE';
export type SeasonRosterStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';

export type SeasonRosterMembership = {
  id: string;
  leagueSeasonId: string;
  seasonTeamId: string;
  teamId: string;
  playerId: string;
  status: SeasonRosterStatus;
  jerseyNumber?: number;
  position?: string;
  joinedAt: Date;
  leftAt?: Date;
};

export type SeasonPlayerTransfer = {
  id: string;
  leagueSeasonId: string;
  playerId: string;
  fromSeasonTeamId: string;
  toSeasonTeamId: string;
  status: SeasonRosterStatus;
  reason?: string;
  createdAt: Date;
  reviewedAt?: Date;
};

export type SeasonRegistrationRosterChange = {
  playerId: string;
  action: RosterChangeAction;
  jerseyNumber?: number;
  position?: string;
};

export type CreateSeasonRegistrationCommand = {
  leagueSeasonId: string;
  type: SeasonRegistrationType;
  teamId?: string;
  requestedTeamName?: string;
  applicantName: string;
  applicantEmail: string;
  notes?: string;
  rosterChanges?: SeasonRegistrationRosterChange[];
};

export type SeasonRegistrationApplication = CreateSeasonRegistrationCommand & {
  id: string;
  status: SeasonRegistrationStatus;
  createdAt: Date;
  updatedAt: Date;
};
