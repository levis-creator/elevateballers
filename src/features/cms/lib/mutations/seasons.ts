import { prisma } from '../../../../lib/prisma';
import type { CreateSeasonInput, UpdateSeasonInput, Season } from '../../types';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function createSeason(data: CreateSeasonInput): Promise<Season> {
  if (!data.leagueId) throw new Error('League ID is required for creating a season');

  let slug = data.slug || slugify(data.name);
  let uniqueSlug = slug;
  let counter = 1;
  while (await prisma.season.findFirst({ where: { slug: uniqueSlug, leagueId: data.leagueId } })) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  return await prisma.season.create({
    data: {
      ...data,
      slug: uniqueSlug,
      leagueId: data.leagueId,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      bracketType: data.bracketType || null,
    },
  });
}

export async function updateSeason(id: string, data: UpdateSeasonInput): Promise<Season | null> {
  try {
    const existing = await prisma.season.findUnique({ where: { id } });
    if (!existing) return null;

    const leagueId = data.leagueId || existing.leagueId;

    if (data.name && !data.slug) {
      const newSlug = slugify(data.name);
      let uniqueSlug = newSlug;
      let counter = 1;
      while (await prisma.season.findFirst({ where: { slug: uniqueSlug, leagueId, NOT: { id } } })) {
        uniqueSlug = `${newSlug}-${counter}`;
        counter++;
      }
      data.slug = uniqueSlug;
    } else if (data.slug) {
      let uniqueSlug = data.slug;
      let counter = 1;
      const base = data.slug;
      while (await prisma.season.findFirst({ where: { slug: uniqueSlug, leagueId, NOT: { id } } })) {
        uniqueSlug = `${base}-${counter}`;
        counter++;
      }
      data.slug = uniqueSlug;
    }

    const updateData: any = { ...data };
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);
    if (data.leagueId) updateData.leagueId = data.leagueId;

    return await prisma.season.update({ where: { id }, data: updateData });
  } catch (error) {
    console.error('Error updating season:', error);
    return null;
  }
}

export async function deleteSeason(id: string): Promise<boolean> {
  try {
    await prisma.season.delete({ where: { id } });
    return true;
  } catch (error) {
    console.error('Error deleting season:', error);
    return false;
  }
}
