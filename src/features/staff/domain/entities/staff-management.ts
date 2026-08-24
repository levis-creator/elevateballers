import { z } from "zod";
import type { Prisma, StaffRole, TeamStaff } from "@prisma/client";

export type StaffWithAssignments = Prisma.StaffGetPayload<{ include: { teams: { include: { team: true } } } }>;
export type StaffAssignment = Pick<TeamStaff, "teamId" | "role" | "effectiveFrom">;

export const STAFF_ROLES: StaffRole[] = [
  "COACH", "ASSISTANT_COACH", "MANAGER", "ASSISTANT_MANAGER",
  "PHYSIOTHERAPIST", "TRAINER", "ANALYST", "OTHER",
];

const optionalText = (max: number) => z.string().trim().max(max).optional();

export const staffAssignmentSchema = z.object({
  teamId: z.string().min(1).max(64),
  role: z.enum(STAFF_ROLES as [StaffRole, ...StaffRole[]]),
  effectiveFrom: z.coerce.date().nullable().optional(),
});

export const staffMutationSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  slug: optionalText(120),
  tagline: optionalText(240),
  email: z.string().trim().email().max(254).optional(),
  phone: optionalText(40),
  phoneSecondary: optionalText(40),
  nextOfKin: optionalText(160),
  role: z.enum(STAFF_ROLES as [StaffRole, ...StaffRole[]]),
  bio: optionalText(5000),
  internalNote: optionalText(5000),
  image: optionalText(1000),
  licenseNumber: optionalText(120),
  licenseExpiresAt: z.coerce.date().nullable().optional(),
  safeguardingStatus: optionalText(80),
  idNumber: optionalText(120),
  active: z.boolean().optional(),
  approved: z.boolean().optional(),
  assignments: z.array(staffAssignmentSchema).max(100).optional(),
});

export const staffUpdateSchema = staffMutationSchema.partial();
export const staffBulkDeleteSchema = z.object({ ids: z.array(z.string().min(1).max(64)).min(1).max(100) });

export type StaffMutationInput = z.infer<typeof staffMutationSchema>;
export type StaffUpdateInput = z.infer<typeof staffUpdateSchema>;

export const staffRoleLabel = (role: StaffRole): string => ({
  COACH: "Coach", ASSISTANT_COACH: "Assistant Coach", MANAGER: "Manager",
  ASSISTANT_MANAGER: "Assistant Manager", PHYSIOTHERAPIST: "Physiotherapist",
  TRAINER: "Trainer", ANALYST: "Analyst", OTHER: "Other",
}[role] ?? role);
