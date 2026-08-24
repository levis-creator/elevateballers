/** Compatibility adapter; League Staff mutations are owned by features/staff. */
export { createLeagueStaff, updateLeagueStaff, deactivateLeagueStaff as deleteLeagueStaff } from "@/features/staff/data/datasources/league-staff-repository";
export type { LeagueStaffInput as CreateLeagueStaffInput, LeagueStaffInput as UpdateLeagueStaffInput } from "@/features/staff/data/datasources/league-staff-repository";
