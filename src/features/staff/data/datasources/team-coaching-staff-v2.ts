/**
 * Team coaching-staff datasource — reads a team's people from the NEW
 * `team_staff_members` table, ordered coach → manager → support. Returns [] on
 * any failure (incl. the table not existing yet) so callers fall back to the
 * legacy `team_staff` join — zero-downtime while the split migration rolls out.
 */
import { prisma } from "@/lib/prisma";
import { getDisplayImageUrl } from "@/lib/asset-url";
import type { StaffMember } from "@/features/staff/domain/entities/staff-v2";

const initialsOf = (name: string): string => {
	const w = name.trim().split(/\s+/).filter(Boolean);
	return ((w[0]?.[0] || "") + (w[1]?.[0] || "")).toUpperCase() || "?";
};

/** Display order for the `type` buckets. */
const TYPE_RANK: Record<string, number> = { coach: 0, manager: 1, support: 2 };

/** Active coaching staff for a team from the new table, ordered coach → manager
 *  → support (then sortOrder, then name). Empty array when the table is
 *  unavailable or the team has no migrated rows — caller then uses legacy data. */
export async function getTeamCoachingStaff(teamId: string): Promise<StaffMember[]> {
	try {
		const rows = await prisma.teamStaffMember.findMany({
			where: { teamId, active: true },
			orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
		});
		if (!rows.length) return [];

		return rows
			.map((r) => ({
				name: r.name,
				role: r.role,
				type: r.type,
				initials: initialsOf(r.name),
				email: r.email ?? null,
				image: getDisplayImageUrl(r.photo),
			}))
			.sort((a, b) => (TYPE_RANK[a.type] ?? 9) - (TYPE_RANK[b.type] ?? 9))
			.map(({ type, ...member }) => member);
	} catch {
		return [];
	}
}
