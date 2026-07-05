import { prisma } from "@/lib/prisma";

export async function getTeamStaffMembers(teamId: string, includeInactive = false) {
	return prisma.teamStaffMember.findMany({
		where: { teamId, ...(includeInactive ? {} : { active: true }) },
		include: { season: true },
		orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
	});
}

export async function getTeamStaffMemberById(id: string) {
	return prisma.teamStaffMember.findUnique({
		where: { id },
		include: { team: true, season: true },
	});
}
