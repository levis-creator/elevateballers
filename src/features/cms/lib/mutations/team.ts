import { prisma } from '../../../../lib/prisma';
import { generateSlug } from '../utils';
import type { CreateTeamInput, UpdateTeamInput, Team } from '../../types';

async function generateUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
  let slug = generateSlug(baseSlug);
  let counter = 1;
  const original = slug;

  while (true) {
    const where: any = { slug };
    if (excludeId) where.id = { not: excludeId };
    const existing = await prisma.team.findFirst({ where });
    if (!existing) return slug;
    slug = `${original}-${counter}`;
    counter++;
  }
}

export async function createTeam(data: CreateTeamInput): Promise<Team> {
  const slug = data.slug || await generateUniqueSlug(data.name);

  const team = await prisma.team.create({
    data: { ...data, slug, approved: data.approved ?? true },
  });

  if (team.logo) {
    try {
      const { trackFileUsageByUrl } = await import('../../../../lib/file-usage');
      await trackFileUsageByUrl(team.logo, 'TEAM', team.id, 'logo');
    } catch (error) {
      console.warn('Failed to track file usage for team logo:', error);
    }
  }

  return team;
}

export async function updateTeam(id: string, data: UpdateTeamInput): Promise<Team | null> {
  try {
    const existing = await prisma.team.findUnique({ where: { id }, select: { logo: true } });
    const updateData: any = { ...data };

    if (data.name && !data.slug) {
      updateData.slug = await generateUniqueSlug(data.name, id);
    } else if (data.slug) {
      updateData.slug = await generateUniqueSlug(data.slug, id);
    }

    const team = await prisma.team.update({ where: { id }, data: updateData });

    if (data.logo !== undefined && data.logo !== existing?.logo) {
      try {
        const { updateFileUsageOnChange } = await import('../../../../lib/file-usage');
        await updateFileUsageOnChange(existing?.logo || '', data.logo || '', 'TEAM', id, 'logo');
      } catch (error) {
        console.warn('Failed to track file usage for team logo update:', error);
      }
    }

    return team;
  } catch (error) {
    console.error('Error updating team:', error);
    return null;
  }
}

export async function deleteTeam(id: string): Promise<boolean> {
  try {
    await prisma.team.delete({ where: { id } });
    return true;
  } catch (error) {
    console.error('Error deleting team:', error);
    return false;
  }
}
