import { prisma } from '../../../../../lib/prisma';
import type { CreateSeasonInput, UpdateSeasonInput, Season } from '../../../types';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Normalizes a datetime input for the DB: `undefined` = leave unchanged,
 * `null`/`''` = clear, anything else = a Date.
 */
function toDbDate(value: Date | string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  return new Date(value);
}

export async function createSeason(data: CreateSeasonInput): Promise<Season> {
  const { leagueIds, slug: providedSlug, name, startDate, endDate, ...rest } = data;

  // Slug is now globally unique across all seasons.
  let uniqueSlug = providedSlug || slugify(name);
  const base = uniqueSlug;
  let counter = 1;
  while (await prisma.season.findFirst({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${base}-${counter}`;
    counter++;
  }

  return await prisma.season.create({
    data: {
      ...rest,
      name,
      slug: uniqueSlug,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      registrationOpensAt: toDbDate(data.registrationOpensAt) ?? null,
      registrationClosesAt: toDbDate(data.registrationClosesAt) ?? null,
      bracketType: data.bracketType || null,
      // Attach the season to its leagues via the join table (optional).
      ...(leagueIds && leagueIds.length
        ? { leagueSeasons: { create: leagueIds.map((leagueId) => ({ leagueId })) } }
        : {}),
    },
  });
}

export async function updateSeason(id: string, data: UpdateSeasonInput): Promise<Season | null> {
  try {
    const existing = await prisma.season.findUnique({ where: { id } });
    if (!existing) return null;

    const { leagueIds, ...fields } = data;

    // Regenerate a globally-unique slug when name/slug changes.
    const desiredSlug = fields.slug || (fields.name && !fields.slug ? slugify(fields.name) : undefined);
    if (desiredSlug) {
      let uniqueSlug = desiredSlug;
      let counter = 1;
      while (await prisma.season.findFirst({ where: { slug: uniqueSlug, NOT: { id } } })) {
        uniqueSlug = `${desiredSlug}-${counter}`;
        counter++;
      }
      fields.slug = uniqueSlug;
    }

    const updateData: any = { ...fields };
    if (fields.startDate) updateData.startDate = new Date(fields.startDate);
    if (fields.endDate) updateData.endDate = new Date(fields.endDate);
    if ('registrationOpensAt' in fields) updateData.registrationOpensAt = toDbDate(fields.registrationOpensAt);
    if ('registrationClosesAt' in fields) updateData.registrationClosesAt = toDbDate(fields.registrationClosesAt);

    // When leagueIds is provided, replace the season's league attachments (set semantics).
    if (leagueIds) {
      updateData.leagueSeasons = {
        deleteMany: {},
        create: leagueIds.map((leagueId) => ({ leagueId })),
      };
    }

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
