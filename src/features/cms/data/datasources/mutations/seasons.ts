import type { Prisma } from '@prisma/client';
import { prisma } from '../../../../../lib/prisma';
import type { CreateSeasonInput, UpdateSeasonInput, Season } from '../../../types';

type ConferenceInput = { id?: string; name: string; teamIds?: string[] };

/**
 * Reconcile a season's conferences by id (rename-safe — never delete-and-recreate,
 * which would drop conferenceId on every assigned team) and, when a row carries
 * `teamIds`, roster those teams under `leagueId` and set them as the conference's
 * members. `teamIds === undefined` leaves that conference's roster untouched.
 * Runs inside the caller's transaction.
 */
async function reconcileConferences(
  tx: Prisma.TransactionClient,
  seasonId: string,
  conferences: ConferenceInput[],
  leagueId: string | null,
): Promise<void> {
  const keptIds = conferences.filter((c) => c.id).map((c) => c.id as string);
  // Delete removed rows first, freeing their names for reuse this save.
  await tx.conference.deleteMany({
    where: { seasonId, ...(keptIds.length ? { id: { notIn: keptIds } } : {}) },
  });

  for (const [index, c] of conferences.entries()) {
    let conferenceId = c.id;
    if (conferenceId) {
      await tx.conference.update({ where: { id: conferenceId }, data: { name: c.name, sortOrder: index } });
    } else {
      const created = await tx.conference.create({
        data: { seasonId, name: c.name, sortOrder: index },
        select: { id: true },
      });
      conferenceId = created.id;
    }

    // Team membership only when the form supplied it AND we know which league to
    // roster under (single-league seasons). Set semantics: the given teams become
    // the members; any team dropped from the list is unassigned (but stays rostered).
    if (c.teamIds !== undefined && leagueId) {
      const ids = [...new Set(c.teamIds.filter(Boolean))];
      if (ids.length) {
        await tx.seasonTeam.createMany({
          data: ids.map((teamId) => ({ seasonId, leagueId, teamId })),
          skipDuplicates: true,
        });
        await tx.seasonTeam.updateMany({ where: { seasonId, teamId: { in: ids } }, data: { conferenceId } });
      }
      await tx.seasonTeam.updateMany({
        where: { seasonId, conferenceId, ...(ids.length ? { teamId: { notIn: ids } } : {}) },
        data: { conferenceId: null },
      });
    }
  }
}

/** The league to roster conference teams under: only unambiguous with one league. */
function singleLeague(leagueIds?: string[]): string | null {
  return leagueIds && leagueIds.length === 1 ? leagueIds[0] : null;
}

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
  const { leagueIds, conferences, slug: providedSlug, name, startDate, endDate, ...rest } = data;

  // Slug is now globally unique across all seasons.
  let uniqueSlug = providedSlug || slugify(name);
  const base = uniqueSlug;
  let counter = 1;
  while (await prisma.season.findFirst({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${base}-${counter}`;
    counter++;
  }

  const season = await prisma.season.create({
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

  // Conferences (and any selected teams) after the season exists, so team rows
  // can be rostered against it. Reuses the same reconcile path as updateSeason.
  if (conferences && conferences.length) {
    await prisma.$transaction((tx) => reconcileConferences(tx, season.id, conferences, singleLeague(leagueIds)));
  }

  return season;
}

export async function updateSeason(id: string, data: UpdateSeasonInput): Promise<Season | null> {
  try {
    const existing = await prisma.season.findUnique({ where: { id } });
    if (!existing) return null;

    const { leagueIds, conferences, ...fields } = data;

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

    // Conferences reconcile by id (rename-safe) and, on single-league seasons,
    // roster+assign any selected teams. `undefined` = leave untouched; `[]` = clear.
    return await prisma.$transaction(async (tx) => {
      if (conferences) {
        await reconcileConferences(tx, id, conferences, singleLeague(leagueIds));
      }
      return await tx.season.update({ where: { id }, data: updateData });
    });
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
