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

async function generateUniqueStaffSlug(baseSlug: string, excludeId?: string): Promise<string> {
  let slug = generateSlug(baseSlug);
  let counter = 1;
  const original = slug;

  while (true) {
    const where: any = { slug };
    if (excludeId) where.id = { not: excludeId };
    const existing = await prisma.staff.findFirst({ where });
    if (!existing) return slug;
    slug = `${original}-${counter}`;
    counter++;
  }
}

export async function createStaff(data: CreateStaffInput): Promise<Staff> {
  const baseName = `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim() || 'staff';
  const slug = data.slug || await generateUniqueStaffSlug(baseName);

  const staff = await prisma.staff.create({
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

export async function assignStaffToTeam(data: CreateTeamStaffInput): Promise<TeamStaff> {
  const existing = await prisma.teamStaff.findUnique({
    where: { teamId_staffId: { teamId: data.teamId, staffId: data.staffId } },
  });

  if (existing) throw new Error('This staff member is already assigned to this team');

  return await prisma.teamStaff.create({ data });
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
