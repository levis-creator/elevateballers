import { prisma } from '../../../../../lib/prisma';
import { generateSlug } from '../../../domain/usecases/utils';
import type {
  CreateStaffInput,
  UpdateStaffInput,
  Staff,
  CreateTeamStaffInput,
  UpdateTeamStaffInput,
  TeamStaff,
} from '../../../types';

async function generateUniqueStaffSlug(baseSlug: string, excludeId?: string, db: any = prisma): Promise<string> {
  let slug = generateSlug(baseSlug);
  let counter = 1;
  const original = slug;

  while (true) {
    const where: any = { slug };
    if (excludeId) where.id = { not: excludeId };
    const existing = await db.staff.findFirst({ where });
    if (!existing) return slug;
    slug = `${original}-${counter}`;
    counter++;
  }
}

export async function createStaff(data: CreateStaffInput, db: any = prisma): Promise<Staff> {
  const baseName = `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim() || 'staff';
  const slug = data.slug || await generateUniqueStaffSlug(baseName, undefined, db);

  const staff = await db.staff.create({
    data: { ...data, slug, approved: data.approved ?? true },
  });

  if (staff.image) {
    try {
      const { trackFileUsageByUrl } = await import('../../../../../lib/file-usage');
      await trackFileUsageByUrl(staff.image, 'STAFF', staff.id, 'image');
    } catch (error) {
      console.warn('Failed to track file usage for staff image:', error);
    }
  }

  return staff;
}

export async function updateStaff(id: string, data: UpdateStaffInput): Promise<Staff | null> {
  try {
    const existing = await prisma.staff.findUnique({
      where: { id },
      select: { image: true, firstName: true, lastName: true },
    });

    const updateData: any = { ...data };

    if ((data.firstName || data.lastName) && !data.slug) {
      const firstName = data.firstName ?? existing?.firstName ?? '';
      const lastName = data.lastName ?? existing?.lastName ?? '';
      const baseName = `${firstName} ${lastName}`.trim() || 'staff';
      updateData.slug = await generateUniqueStaffSlug(baseName, id);
    } else if (data.slug) {
      updateData.slug = await generateUniqueStaffSlug(data.slug, id);
    }

    const staff = await prisma.staff.update({ where: { id }, data: updateData });

    if (data.image !== undefined && data.image !== existing?.image) {
      try {
        const { updateFileUsageOnChange } = await import('../../../../../lib/file-usage');
        await updateFileUsageOnChange(existing?.image || '', data.image || '', 'STAFF', id, 'image');
      } catch (error) {
        console.warn('Failed to track file usage for staff image update:', error);
      }
    }

    return staff;
  } catch (error) {
    console.error('Error updating staff:', error);
    return null;
  }
}

export async function deleteStaff(id: string): Promise<boolean> {
  try {
    await prisma.staff.delete({ where: { id } });
    return true;
  } catch (error) {
    console.error('Error deleting staff:', error);
    return false;
  }
}

export async function assignStaffToTeam(data: CreateTeamStaffInput, db: any = prisma): Promise<TeamStaff> {
  const existing = await db.teamStaff.findFirst({ where: { teamId: data.teamId, staffId: data.staffId, effectiveTo: null } });

  if (existing) throw new Error('This staff member is already assigned to this team');

  return await db.teamStaff.create({ data });
}

export async function updateTeamStaff(id: string, data: UpdateTeamStaffInput): Promise<TeamStaff | null> {
  try {
    return await prisma.teamStaff.update({ where: { id }, data });
  } catch (error) {
    console.error('Error updating team staff:', error);
    return null;
  }
}

export async function removeStaffFromTeam(id: string): Promise<boolean> {
  try {
    await prisma.teamStaff.delete({ where: { id } });
    return true;
  } catch (error) {
    console.error('Error removing staff from team:', error);
    return false;
  }
}

export type StaffAssignmentInput = {
  teamId: string;
  role: StaffRole;
  effectiveFrom?: Date | null;
};

/** Synchronizes the admin staff form's current team assignments. */
export async function syncStaffAssignments(
  staffId: string,
  assignments: StaffAssignmentInput[],
  db: any = prisma,
): Promise<void> {
  const teamIds = assignments.map((assignment) => assignment.teamId);
  if (new Set(teamIds).size !== teamIds.length) throw new Error('A staff member can only be assigned once to each team');

  await db.$transaction(async (tx: any) => {
    const existing = await tx.teamStaff.findMany({ where: { staffId }, select: { id: true, teamId: true } });
    const keep = new Set(teamIds);
    const removeIds = existing.filter((row: any) => !keep.has(row.teamId)).map((row: any) => row.id);
    if (removeIds.length) await tx.teamStaff.deleteMany({ where: { id: { in: removeIds } } });

    for (const assignment of assignments) {
      const current = await tx.teamStaff.findFirst({ where: { teamId: assignment.teamId, staffId, effectiveTo: null } });
      if (current) {
        await tx.teamStaff.update({ where: { id: current.id }, data: { role: assignment.role, effectiveFrom: assignment.effectiveFrom ?? undefined } });
      } else {
        await tx.teamStaff.create({ data: { teamId: assignment.teamId, staffId, role: assignment.role, effectiveFrom: assignment.effectiveFrom ?? new Date() } });
      }
    }
  });
}
