import * as repository from "@/features/staff/data/datasources/team-coaching-staff-repository";
import { z } from "zod";
const input = z.object({ teamId: z.string().min(1).max(64), seasonId: z.string().max(64).nullable().optional(), name: z.string().trim().min(1).max(160), role: z.string().trim().min(1).max(160), type: z.enum(["coach", "manager", "support"]), email: z.string().email().max(254).nullable().optional(), photo: z.string().max(1000).nullable().optional(), sortOrder: z.number().int().min(-10000).max(10000).optional(), active: z.boolean().optional() });
export const listTeamCoachingStaff = repository.listTeamCoachingStaff;
export const getTeamCoachingStaff = repository.getTeamCoachingStaffById;
export const createTeamCoachingStaff = (data: unknown) => repository.createTeamCoachingStaff(input.parse(data));
export const updateTeamCoachingStaff = (id: string, data: unknown) => repository.updateTeamCoachingStaff(id, input.omit({ teamId: true }).partial().parse(data));
export const deleteTeamCoachingStaff = repository.deactivateTeamCoachingStaff;
export const teamExists = repository.teamExists;
