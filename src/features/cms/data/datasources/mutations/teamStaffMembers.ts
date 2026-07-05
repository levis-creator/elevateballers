import { prisma } from "@/lib/prisma";
import type { TeamStaffMember } from "@prisma/client";

export type TeamStaffType = "coach" | "manager" | "support";

export type CreateTeamStaffMemberInput = {
	teamId: string;
	seasonId?: string | null;
	name: string;
	role: string;
	type: TeamStaffType;
	email?: string | null;
	photo?: string | null;
	sortOrder?: number;
	active?: boolean;
};

export type UpdateTeamStaffMemberInput = Partial<Omit<CreateTeamStaffMemberInput, "teamId">>;

export async function createTeamStaffMember(data: CreateTeamStaffMemberInput): Promise<TeamStaffMember> {
	return prisma.teamStaffMember.create({
		data: {
			...data,
			active: data.active ?? true,
			sortOrder: data.sortOrder ?? 0,
		},
	});
}

export async function updateTeamStaffMember(id: string, data: UpdateTeamStaffMemberInput): Promise<TeamStaffMember | null> {
	try {
		return await prisma.teamStaffMember.update({ where: { id }, data });
	} catch (error) {
		console.error("Error updating team staff member:", error);
		return null;
	}
}

export async function removeTeamStaffMember(id: string): Promise<boolean> {
	try {
		await prisma.teamStaffMember.update({ where: { id }, data: { active: false } });
		return true;
	} catch (error) {
		console.error("Error deactivating team staff member:", error);
		return false;
	}
}
