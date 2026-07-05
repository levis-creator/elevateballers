import { prisma } from "@/lib/prisma";
import type { LeagueStaff } from "@prisma/client";

export type CreateLeagueStaffInput = {
	name: string;
	role: string;
	department: string;
	email?: string;
	photo?: string;
	active?: boolean;
	sortOrder?: number;
};

export type UpdateLeagueStaffInput = Partial<CreateLeagueStaffInput>;

export async function createLeagueStaff(data: CreateLeagueStaffInput): Promise<LeagueStaff> {
	return prisma.leagueStaff.create({
		data: {
			...data,
			active: data.active ?? true,
			sortOrder: data.sortOrder ?? 0,
		},
	});
}

export async function updateLeagueStaff(id: string, data: UpdateLeagueStaffInput): Promise<LeagueStaff | null> {
	try {
		return await prisma.leagueStaff.update({ where: { id }, data });
	} catch (error) {
		console.error("Error updating league staff:", error);
		return null;
	}
}

export async function deleteLeagueStaff(id: string): Promise<boolean> {
	try {
		await prisma.leagueStaff.update({ where: { id }, data: { active: false } });
		return true;
	} catch (error) {
		console.error("Error deactivating league staff:", error);
		return false;
	}
}
