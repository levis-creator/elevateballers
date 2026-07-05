/**
 * League-Staff datasource — reads org-wide people from the NEW `league_staff`
 * table and groups them by department for the /staff page. Returns null on any
 * failure (incl. the table not existing yet, before the split migration runs) so
 * the use-case falls back to the static content — zero-downtime rollout.
 */
import { prisma } from "@/lib/prisma";
import { getDisplayImageUrl } from "@/lib/asset-url";
import type { StaffDepartment, StaffMember } from "@/features/staff/domain/entities/staff-v2";

const initialsOf = (name: string): string => {
	const w = name.trim().split(/\s+/).filter(Boolean);
	return ((w[0]?.[0] || "") + (w[1]?.[0] || "")).toUpperCase() || "?";
};

/** League staff grouped by department (department → sortOrder → name), or null
 *  when the table is empty/unavailable. */
export async function getLeagueStaffGrouped(): Promise<StaffDepartment[] | null> {
	try {
		const rows = await prisma.leagueStaff.findMany({
			where: { active: true },
			orderBy: [{ department: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
		});
		if (!rows.length) return null;

		const byDept = new Map<string, StaffMember[]>();
		for (const r of rows) {
			const member: StaffMember = {
				name: r.name,
				role: r.role,
				initials: initialsOf(r.name),
				email: r.email ?? null,
				image: getDisplayImageUrl(r.photo),
			};
			const list = byDept.get(r.department) ?? [];
			list.push(member);
			byDept.set(r.department, list);
		}
		// Preserve first-seen department order (rows are already department-sorted).
		return [...byDept.entries()].map(([name, members]) => ({ name, members }));
	} catch {
		// Table missing (pre-migration) or query error → let the use-case fall back.
		return null;
	}
}
