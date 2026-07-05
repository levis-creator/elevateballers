/**
 * Use-case for the v2 Staff page. Returns static content for now; when the staff
 * directory is wired to the CMS/DB, replace the body with a fetch (falling back
 * to STAFF_PAGE_DATA) — the return type stays the same so the page won't change.
 */
import { STAFF_PAGE_DATA } from "@/features/staff/data/datasources/staff-v2.static";
import type { StaffPageData } from "@/features/staff/domain/entities/staff-v2";

export async function getStaffData(): Promise<StaffPageData> {
	return STAFF_PAGE_DATA;
}
