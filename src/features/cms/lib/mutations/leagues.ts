import { prisma } from '../../../../lib/prisma';
import type { CreateLeagueInput, UpdateLeagueInput, League } from '../../types';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function createLeague(data: CreateLeagueInput): Promise<League> {
  let slug = data.slug || slugify(data.name);
  let uniqueSlug = slug;
  let counter = 1;
  while (await prisma.league.findUnique({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  const league = await prisma.league.create({ data: { ...data, slug: uniqueSlug } });

  if (league.logo) {
    try {
      const { trackFileUsageByUrl } = await import('../../../../lib/file-usage');
      await trackFileUsageByUrl(league.logo, 'LEAGUE', league.id, 'logo');
    } catch (error) {
      console.warn('Failed to track file usage for league logo:', error);
    }
  }

  return league;
}

export async function updateLeague(id: string, data: UpdateLeagueInput): Promise<League | null> {
  try {
    if (data.name && !data.slug) {
      const newSlug = slugify(data.name);
      let uniqueSlug = newSlug;
      let counter = 1;
      while (await prisma.league.findFirst({ where: { slug: uniqueSlug, NOT: { id } } })) {
        uniqueSlug = `${newSlug}-${counter}`;
        counter++;
      }
      data.slug = uniqueSlug;
    }

    const existing = await prisma.league.findUnique({ where: { id }, select: { logo: true } });
    const league = await prisma.league.update({ where: { id }, data });

    if (data.logo !== undefined && data.logo !== existing?.logo) {
      try {
        const { updateFileUsageOnChange } = await import('../../../../lib/file-usage');
        await updateFileUsageOnChange(existing?.logo || '', data.logo || '', 'LEAGUE', id, 'logo');
      } catch (error) {
        console.warn('Failed to track file usage for league logo update:', error);
      }
    }

    return league;
  } catch (error) {
    console.error('Error updating league:', error);
    return null;
  }
}

export async function deleteLeague(id: string): Promise<boolean> {
  try {
    await prisma.league.delete({ where: { id } });
    return true;
  } catch (error) {
    console.error('Error deleting league:', error);
    return false;
  }
}
