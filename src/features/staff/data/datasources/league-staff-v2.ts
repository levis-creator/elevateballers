/**
 * League-Staff datasource — reads org-wide people from the NEW `league_staff`
 * table. The "Leadership" department becomes the spotlight `leaders` (with bio);
 * every other department is a person grid. Returns null on any failure (incl. the
 * table not existing yet) so the use-case falls back to static content.
 */
import { prisma } from "@/lib/prisma";
import { getDisplayImageUrl } from "@/lib/asset-url";
import type { StaffDepartment, StaffMember, StaffLeader } from "@/features/staff/domain/entities/staff-v2";

const LEADERSHIP = "Leadership";

const initialsOf = (name: string): string => {
	const w = name.trim().split(/\s+/).filter(Boolean);
	return ((w[0]?.[0] || "") + (w[1]?.[0] || "")).toUpperCase() || "?";
};

export interface LeagueStaffGrouped {
	leaders: StaffLeader[];
	departments: StaffDepartment[];
}

/** Live league staff split into leadership spotlight + department grids, or null
 *  when the table is empty/unavailable. */
export async function getLeagueStaffGrouped(): Promise<LeagueStaffGrouped | null> {
	try {
		const rows = await prisma.leagueStaff.findMany({
			where: { active: true },
			orderBy: [{ department: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
		});
		if (!rows.length) return null;

		const leaders: StaffLeader[] = [];
		const byDept = new Map<string, StaffMember[]>();

		for (const r of rows) {
			if (r.department === LEADERSHIP) {
				leaders.push({
					name: r.name,
					role: r.role,
					badge: LEADERSHIP,
					bio: r.bio ?? "",
					initials: initialsOf(r.name),
					image: getDisplayImageUrl(r.photo),
				});
				continue;
			}
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

		const departments = [...byDept.entries()].map(([name, members]) => ({ name, members }));
		return { leaders, departments };
	} catch {
		return null;
	}
}
