import { prisma } from "@/lib/prisma";
import type { LeagueStaff } from "@prisma/client";

export async function getLeagueStaff(includeInactive = false): Promise<LeagueStaff[]> {
	return prisma.leagueStaff.findMany({
		where: includeInactive ? undefined : { active: true },
		orderBy: [{ department: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
	});
}

export async function getLeagueStaffById(id: string): Promise<LeagueStaff | null> {
	return prisma.leagueStaff.findUnique({ where: { id } });
}
