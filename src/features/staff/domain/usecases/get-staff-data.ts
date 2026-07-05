/**
 * Use-case for the v2 /staff ("Our Staff") page. Prefers live org-wide staff from
 * the `league_staff` table (Leadership spotlight + department grids); falls back
 * to the static content when the table is empty or unavailable. No team coaches
 * here — those live on team pages.
 */
import { getLeagueStaffGrouped } from "@/features/staff/data/datasources/league-staff-v2";
import { STAFF_PAGE_DATA, STAFF_INTRO } from "@/features/staff/data/datasources/staff-v2.static";
import type { StaffPageData } from "@/features/staff/domain/entities/staff-v2";

export async function getStaffData(): Promise<StaffPageData> {
	const grouped = await getLeagueStaffGrouped();
	if (!grouped || (grouped.leaders.length === 0 && grouped.departments.length === 0)) {
		return STAFF_PAGE_DATA;
	}
	return { intro: STAFF_INTRO, leaders: grouped.leaders, departments: grouped.departments };
}
