/**
 * Use-case for the v2 /staff ("Our Staff") page. Prefers live org-wide staff from
 * the `league_staff` table (Leadership spotlight + department grids); falls back
 * to the static content when the table is empty or unavailable. No team coaches
 * here — those live on team pages.
 */
/** Compatibility export for the original use-case path. */
export { getStaffPageData as getStaffData } from "@/features/staff/application/usecases/get-staff-page-data";
