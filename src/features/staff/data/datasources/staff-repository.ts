import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { StaffAssignment, StaffAssignmentHistory, StaffMutationInput, StaffTransferInput, StaffTransferRecord, StaffUpdateInput, StaffWithAssignments } from "@/features/staff/domain/entities/staff-management";

type Db = typeof prisma | Prisma.TransactionClient;
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "staff";

async function uniqueSlug(base: string, excludeId?: string, db: Db = prisma) {
  const original = slugify(base);
  let slug = original;
  for (let i = 1; await db.staff.findFirst({ where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) }, select: { id: true } }); i++) slug = `${original}-${i}`;
  return slug;
}

export async function listStaff() {
  return prisma.staff.findMany({ include: { user: { select: { id: true, name: true, email: true, active: true, activatedAt: true } }, teams: { include: { team: { select: { id: true, name: true } } } } }, orderBy: [{ firstName: "asc" }, { lastName: "asc" }] });
}

export async function findStaff(id: string): Promise<StaffWithAssignments | null> {
  return prisma.staff.findUnique({ where: { id }, include: { teams: { include: { team: true } } } });
}

export async function listStaffAssignmentHistory(staffId: string): Promise<StaffAssignmentHistory[]> {
  return prisma.teamStaff.findMany({ where: { staffId }, include: { team: true, leagueSeason: { include: { league: true, season: true } } }, orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }] });
}

export async function listStaffTransfers(staffId: string): Promise<StaffTransferRecord[]> {
  return prisma.staffTransfer.findMany({ where: { staffId }, include: { fromTeam: true, toTeam: true }, orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }] });
}

export async function transferStaff(staffId: string, input: StaffTransferInput, actorUserId: string): Promise<StaffTransferRecord> {
  return prisma.$transaction(async (tx) => {
    const previous = await tx.teamStaff.findUnique({ where: { id: input.fromTeamStaffId }, include: { team: true } });
    const now = new Date();
    const effectiveFrom = input.effectiveFrom <= now ? now : input.effectiveFrom;
    if (!previous || previous.staffId !== staffId || previous.effectiveFrom > now || (previous.effectiveTo && previous.effectiveTo <= now)) throw new Error("The current staff assignment was not found");
    if (previous.teamId === input.toTeamId) throw new Error("The new team must be different from the current team");
    const existing = await tx.teamStaff.findFirst({ where: { teamId: input.toTeamId, staffId, effectiveFrom: { lt: effectiveFrom }, OR: [{ effectiveTo: null }, { effectiveTo: { gt: effectiveFrom } }] }, select: { id: true } });
    if (existing) throw new Error("This staff member is already assigned to the selected team");
    await tx.teamStaff.update({ where: { id: previous.id }, data: { effectiveTo: effectiveFrom } });
    await tx.teamStaff.create({ data: { teamId: input.toTeamId, staffId, role: input.role, leagueSeasonId: input.leagueSeasonId ?? previous.leagueSeasonId, effectiveFrom } });
    const staff = await tx.staff.findUnique({ where: { id: staffId }, select: { userId: true, email: true } });
    if (staff?.userId) {
      const isImmediate = effectiveFrom <= now;
      await tx.teamOwnership.updateMany({
        where: { userId: staff.userId, role: "Team Coach", teamId: previous.teamId, revokedAt: null },
        data: isImmediate ? { revokedAt: now, effectiveTo: now } : { effectiveTo: effectiveFrom },
      });
      await tx.teamOwnership.create({
        data: {
          teamId: input.toTeamId,
          userId: staff.userId,
          email: staff.email ?? "",
          role: "Team Coach",
          verifiedAt: now,
          effectiveFrom,
        },
      });
      if (isImmediate) {
        await tx.user.update({ where: { id: staff.userId }, data: { tokenVersion: { increment: 1 } } });
        await tx.userSession.updateMany({ where: { userId: staff.userId, revokedAt: null }, data: { revokedAt: now, revokeReason: "staff_transfer" } });
      }
    }
    return tx.staffTransfer.create({ data: { staffId, fromTeamId: previous.teamId, toTeamId: input.toTeamId, effectiveFrom, reason: input.transferReason || null, actorUserId }, include: { fromTeam: true, toTeam: true } });
  });
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
  if (assignments.length > 2) throw new Error("A staff member can have at most two team assignments");
  if (new Set(assignments.map((a) => a.teamId)).size !== assignments.length) throw new Error("A staff member can only be assigned once to each team");
  const existing = await db.teamStaff.findMany({ where: { staffId, effectiveTo: null }, select: { id: true, teamId: true } });
  const keep = new Set(assignments.map((a) => a.teamId));
  const removeIds = existing.filter((row) => !keep.has(row.teamId)).map((row) => row.id);
  if (removeIds.length) await db.teamStaff.updateMany({ where: { id: { in: removeIds } }, data: { effectiveTo: new Date() } });
  for (const assignment of assignments) {
    const current = await db.teamStaff.findFirst({ where: { teamId: assignment.teamId, staffId, effectiveTo: null } });
    if (current) {
      await db.teamStaff.update({ where: { id: current.id }, data: { role: assignment.role, leagueSeasonId: assignment.leagueSeasonId, effectiveFrom: assignment.effectiveFrom ?? undefined } });
    } else {
      await db.teamStaff.create({ data: { teamId: assignment.teamId, staffId, role: assignment.role, leagueSeasonId: assignment.leagueSeasonId, effectiveFrom: assignment.effectiveFrom ?? new Date() } });
    }
  }
}
