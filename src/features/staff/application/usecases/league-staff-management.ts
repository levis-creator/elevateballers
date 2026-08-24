import * as repository from "@/features/staff/data/datasources/league-staff-repository";
import { z } from "zod";
const input = z.object({ name: z.string().trim().min(1).max(160), role: z.string().trim().min(1).max(160), department: z.string().trim().min(1).max(120), email: z.string().email().max(254).nullable().optional(), photo: z.string().max(1000).nullable().optional(), bio: z.string().max(5000).nullable().optional(), active: z.boolean().optional(), sortOrder: z.number().int().min(-10000).max(10000).optional() });
export const listLeagueStaff = repository.listLeagueStaff;
export const getLeagueStaff = repository.getLeagueStaff;
export const createLeagueStaff = (data: unknown) => repository.createLeagueStaff(input.parse(data));
export const updateLeagueStaff = (id: string, data: unknown) => repository.updateLeagueStaff(id, input.partial().parse(data));
export const deleteLeagueStaff = repository.deactivateLeagueStaff;
