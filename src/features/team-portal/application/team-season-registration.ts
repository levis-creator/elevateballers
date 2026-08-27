import { listTeamSeasonRegistrationOptions, submitTeamSeasonRegistration } from '@/features/team-portal/data/datasources/team-season-registration';

export { listTeamSeasonRegistrationOptions };

export function requestTeamSeasonRegistration(input: Parameters<typeof submitTeamSeasonRegistration>[0]) {
  return submitTeamSeasonRegistration(input);
}
