/** Compatibility adapter; Team Coaching Staff mutations are owned by features/staff. */
export { createTeamCoachingStaff as createTeamStaffMember, updateTeamCoachingStaff as updateTeamStaffMember, deactivateTeamCoachingStaff as removeTeamStaffMember } from "@/features/staff/data/datasources/team-coaching-staff-repository";
export type { TeamCoachingInput as CreateTeamStaffMemberInput, TeamCoachingInput as UpdateTeamStaffMemberInput, TeamStaffType } from "@/features/staff/data/datasources/team-coaching-staff-repository";
