import { prisma } from "@/lib/prisma";
import type { Prisma, Staff } from "@prisma/client";
import type { StaffAssignment, StaffMutationInput, StaffUpdateInput, StaffWithAssignments } from "@/features/staff/domain/entities/staff-management";

type Db = typeof prisma | Prisma.TransactionClient;
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "staff";

async function uniqueSlug(base: string, excludeId?: string, db: Db = prisma) {
  const original = slugify(base);
  let slug = original;
  for (let i = 1; await db.staff.findFirst({ where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) }, select: { id: true } }); i++) slug = `${original}-${i}`;
  return slug;
}

export async function listStaff(): Promise<Staff[]> {
  return prisma.staff.findMany({ orderBy: [{ firstName: "asc" }, { lastName: "asc" }] });
}

export async function findStaff(id: string): Promise<StaffWithAssignments | null> {
  return prisma.staff.findUnique({ where: { id }, include: { teams: { include: { team: true } } } });
}

export async function createStaff(input: StaffMutationInput): Promise<StaffWithAssignments> {
  const { assignments, ...data } = input;
  return prisma.$transaction(async (tx) => {
    const staff = await tx.staff.create({
      data: { ...data, slug: data.slug || await uniqueSlug(`${data.firstName} ${data.lastName}`, undefined, tx), approved: data.approved ?? true },
    });
    await replaceAssignments(staff.id, assignments ?? [], tx);
    return tx.staff.findUniqueOrThrow({ where: { id: staff.id }, include: { teams: { include: { team: true } } } });
  });
}

export async function updateStaff(id: string, input: StaffUpdateInput): Promise<StaffWithAssignments | null> {
  const { assignments, ...raw } = input;
  const data: Prisma.StaffUpdateInput = { ...raw };
  if (raw.firstName !== undefined || raw.lastName !== undefined) {
    const current = await prisma.staff.findUnique({ where: { id }, select: { firstName: true, lastName: true } });
    if (!current) return null;
    if (!raw.slug) data.slug = await uniqueSlug(`${raw.firstName ?? current.firstName} ${raw.lastName ?? current.lastName}`, id);
  } else if (raw.slug) data.slug = await uniqueSlug(raw.slug, id);
  try {
    return prisma.$transaction(async (tx) => {
      await tx.staff.update({ where: { id }, data });
      if (assignments !== undefined) await replaceAssignments(id, assignments, tx);
      return tx.staff.findUniqueOrThrow({ where: { id }, include: { teams: { include: { team: true } } } });
    });
  } catch { return null; }
}

export async function removeStaff(id: string): Promise<boolean> {
  try { await prisma.staff.delete({ where: { id } }); return true; } catch { return false; }
}

export async function bulkRemoveStaff(ids: string[]) {
  return prisma.staff.deleteMany({ where: { id: { in: ids } } });
}

async function replaceAssignments(staffId: string, assignments: StaffAssignment[], db: Db) {
  if (new Set(assignments.map((a) => a.teamId)).size !== assignments.length) throw new Error("A staff member can only be assigned once to each team");
  const existing = await db.teamStaff.findMany({ where: { staffId }, select: { id: true, teamId: true } });
  const keep = new Set(assignments.map((a) => a.teamId));
  const removeIds = existing.filter((row) => !keep.has(row.teamId)).map((row) => row.id);
  if (removeIds.length) await db.teamStaff.deleteMany({ where: { id: { in: removeIds } } });
  for (const assignment of assignments) {
    await db.teamStaff.upsert({
      where: { teamId_staffId: { teamId: assignment.teamId, staffId } },
      create: { teamId: assignment.teamId, staffId, role: assignment.role, effectiveFrom: assignment.effectiveFrom ?? new Date() },
      update: { role: assignment.role, effectiveFrom: assignment.effectiveFrom ?? undefined },
    });
  }
}
