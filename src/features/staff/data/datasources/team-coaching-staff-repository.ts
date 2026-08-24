import { prisma } from "@/lib/prisma";
import type { TeamStaffMember } from "@prisma/client";
export type TeamStaffType = "coach" | "manager" | "support";
export type TeamCoachingInput = { teamId: string; seasonId?: string | null; name: string; role: string; type: TeamStaffType; email?: string | null; photo?: string | null; sortOrder?: number; active?: boolean };
export const listTeamCoachingStaff = (teamId: string, includeInactive = false) => prisma.teamStaffMember.findMany({ where: { teamId, ...(includeInactive ? {} : { active: true }) }, include: { season: true }, orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { name: "asc" }] });
export const getTeamCoachingStaffById = (id: string) => prisma.teamStaffMember.findUnique({ where: { id }, include: { team: true, season: true } });
export const teamExists = (id: string) => prisma.team.findUnique({ where: { id }, select: { id: true } });
export const createTeamCoachingStaff = (data: TeamCoachingInput): Promise<TeamStaffMember> => prisma.teamStaffMember.create({ data: { ...data, active: data.active ?? true, sortOrder: data.sortOrder ?? 0 } });
export async function updateTeamCoachingStaff(id: string, data: Partial<Omit<TeamCoachingInput, "teamId">>): Promise<TeamStaffMember | null> { try { return await prisma.teamStaffMember.update({ where: { id }, data }); } catch { return null; } }
export async function deactivateTeamCoachingStaff(id: string): Promise<boolean> { try { await prisma.teamStaffMember.update({ where: { id }, data: { active: false } }); return true; } catch { return false; } }
