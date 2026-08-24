/** Compatibility adapter; Team Coaching Staff data access is owned by features/staff. */
export { listTeamCoachingStaff as getTeamStaffMembers, getTeamCoachingStaffById as getTeamStaffMemberById } from "@/features/staff/data/datasources/team-coaching-staff-repository";
