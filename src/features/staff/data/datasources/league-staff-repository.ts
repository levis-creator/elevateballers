import { prisma } from "@/lib/prisma";
import type { LeagueStaff } from "@prisma/client";
export type LeagueStaffInput = { name: string; role: string; department: string; email?: string | null; photo?: string | null; bio?: string | null; active?: boolean; sortOrder?: number };
export const listLeagueStaff = (includeInactive = false) => prisma.leagueStaff.findMany({ where: includeInactive ? undefined : { active: true }, orderBy: [{ department: "asc" }, { sortOrder: "asc" }, { name: "asc" }] });
export const getLeagueStaff = (id: string) => prisma.leagueStaff.findUnique({ where: { id } });
export const createLeagueStaff = (data: LeagueStaffInput): Promise<LeagueStaff> => prisma.leagueStaff.create({ data: { ...data, active: data.active ?? true, sortOrder: data.sortOrder ?? 0 } });
export async function updateLeagueStaff(id: string, data: Partial<LeagueStaffInput>): Promise<LeagueStaff | null> { try { return await prisma.leagueStaff.update({ where: { id }, data }); } catch { return null; } }
export async function deactivateLeagueStaff(id: string): Promise<boolean> { try { await prisma.leagueStaff.update({ where: { id }, data: { active: false } }); return true; } catch { return false; } }
