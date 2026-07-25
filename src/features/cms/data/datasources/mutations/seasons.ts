import type { Prisma } from '@prisma/client';
import { prisma } from '../../../../../lib/prisma';
import type { CreateSeasonInput, UpdateSeasonInput, Season } from '../../../types';

type ConferenceInput = { id?: string; name: string; teamIds?: string[] };
type LeagueSeasonInput = NonNullable<CreateSeasonInput['leagueSeasons']>[number];

async function reconcileLeagueSeasons(
  tx: Prisma.TransactionClient,
  seasonId: string,
  inputs: LeagueSeasonInput[],
): Promise<void> {
  const leagueIds = [...new Set(inputs.map((row) => row.leagueId))];
  await tx.leagueSeason.deleteMany({
    where: { seasonId, ...(leagueIds.length ? { leagueId: { notIn: leagueIds } } : {}) },
  });

  for (const input of inputs) {
    const leagueSeason = await tx.leagueSeason.upsert({
      where: { leagueId_seasonId: { leagueId: input.leagueId, seasonId } },
      create: {
        leagueId: input.leagueId,
        seasonId,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        registrationOpensAt: toDbDate(input.registrationOpensAt) ?? null,
        registrationClosesAt: toDbDate(input.registrationClosesAt) ?? null,
        status: input.status,
        competitionStructure: input.competitionStructure,
        bracketType: input.bracketType || null,
      },
      update: {
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        registrationOpensAt: toDbDate(input.registrationOpensAt) ?? null,
        registrationClosesAt: toDbDate(input.registrationClosesAt) ?? null,
        status: input.status,
        competitionStructure: input.competitionStructure,
        bracketType: input.bracketType || null,
      },
      select: { id: true, leagueId: true },
    });
    const teamIds = [...new Set(input.teamIds ?? [])];
    if (teamIds.length) {
      await tx.seasonTeam.createMany({
        data: teamIds.map((teamId) => ({
          seasonId,
          leagueId: input.leagueId,
          leagueSeasonId: leagueSeason.id,
          teamId,
        })),
        skipDuplicates: true,
      });
    }
    await tx.seasonTeam.deleteMany({
      where: {
        leagueSeasonId: leagueSeason.id,
        ...(teamIds.length ? { teamId: { notIn: teamIds } } : {}),
      },
    });

    if (input.competitionStructure === 'CONFERENCES') {
      await reconcileConferences(tx, seasonId, input.conferences ?? [], {
        id: leagueSeason.id,
        leagueId: leagueSeason.leagueId,
      });
    } else {
      await tx.seasonTeam.updateMany({
        where: { leagueSeasonId: leagueSeason.id },
        data: { conferenceId: null },
      });
      await tx.conference.deleteMany({ where: { leagueSeasonId: leagueSeason.id } });
    }
  }
}

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
  leagueSeason: { id: string; leagueId: string },
): Promise<void> {
  const keptIds = conferences.filter((c) => c.id).map((c) => c.id as string);
  // Delete removed rows first, freeing their names for reuse this save.
  await tx.conference.deleteMany({
    where: {
      seasonId,
      leagueSeasonId: leagueSeason.id,
      ...(keptIds.length ? { id: { notIn: keptIds } } : {}),
    },
  });

  // Free all retained names before assigning their final values. This makes
  // swaps such as East ↔ West safe under the per-league unique index.
  for (const id of keptIds) {
    const moved = await tx.conference.updateMany({
      where: {
        id,
        seasonId,
        leagueSeasonId: leagueSeason.id,
      },
      data: { name: `__reconciling_${id}` },
    });
    if (moved.count !== 1) throw new Error('A conference does not belong to this league competition.');
  }

  for (const [index, c] of conferences.entries()) {
    let conferenceId = c.id;
    if (conferenceId) {
      await tx.conference.update({
        where: { id: conferenceId },
        data: { name: c.name, sortOrder: index },
      });
    } else {
      const created = await tx.conference.create({
        data: {
          seasonId,
          leagueSeasonId: leagueSeason.id,
          name: c.name,
          sortOrder: index,
        },
        select: { id: true },
      });
      conferenceId = created.id;
    }

    // Team membership only when the form supplied it AND we know which league to
    // roster under (single-league seasons). Set semantics: the given teams become
    // the members; any team dropped from the list is unassigned (but stays rostered).
    if (c.teamIds !== undefined) {
      const ids = [...new Set(c.teamIds.filter(Boolean))];
      if (ids.length) {
        await tx.seasonTeam.createMany({
          data: ids.map((teamId) => ({
            seasonId,
            leagueId: leagueSeason.leagueId,
            leagueSeasonId: leagueSeason.id,
            teamId,
          })),
          skipDuplicates: true,
        });
        await tx.seasonTeam.updateMany({
          where: { leagueSeasonId: leagueSeason.id, teamId: { in: ids } },
          data: { conferenceId },
        });
      }
      await tx.seasonTeam.updateMany({
        where: {
          leagueSeasonId: leagueSeason.id,
          conferenceId,
          ...(ids.length ? { teamId: { notIn: ids } } : {}),
        },
        data: { conferenceId: null },
      });
    }
  }
}

/** The league to roster conference teams under: only unambiguous with one league. */
async function singleLeagueSeason(
  tx: Prisma.TransactionClient,
  seasonId: string,
  leagueIds?: string[],
): Promise<{ id: string; leagueId: string } | null> {
  if (!leagueIds || leagueIds.length !== 1) return null;
  const row = await tx.leagueSeason.findUnique({
    where: { leagueId_seasonId: { leagueId: leagueIds[0], seasonId } },
    select: { id: true, leagueId: true },
  });
  return row?.id ? { id: row.id, leagueId: row.leagueId } : null;
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
  const {
    leagueIds,
    leagueSeasons,
    conferences,
    slug: providedSlug,
    name,
    startDate,
    endDate,
    ...rest
  } = data;

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
      ...(!leagueSeasons && leagueIds && leagueIds.length
        ? {
            leagueSeasons: {
              create: leagueIds.map((leagueId) => ({
                leagueId,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                registrationOpensAt: toDbDate(data.registrationOpensAt) ?? null,
                registrationClosesAt: toDbDate(data.registrationClosesAt) ?? null,
                bracketType: data.bracketType || null,
                status: data.active === false ? 'COMPLETED' : 'ACTIVE',
                competitionStructure:
                  leagueIds.length === 1 && conferences?.length ? 'CONFERENCES' : 'SINGLE_TABLE',
              })),
            },
          }
        : {}),
    },
  });

  if (leagueSeasons) {
    await prisma.$transaction((tx) => reconcileLeagueSeasons(tx, season.id, leagueSeasons));
  }

  // Conferences (and any selected teams) after the season exists, so team rows
  // can be rostered against it. Reuses the same reconcile path as updateSeason.
  if (!leagueSeasons && conferences && conferences.length) {
    await prisma.$transaction(async (tx) => {
      const scope = await singleLeagueSeason(tx, season.id, leagueIds);
      if (!scope) throw new Error('Conferences require exactly one league competition.');
      await reconcileConferences(tx, season.id, conferences, scope);
    });
  }

  return season;
}

export async function updateSeason(id: string, data: UpdateSeasonInput): Promise<Season | null> {
  try {
    const existing = await prisma.season.findUnique({ where: { id } });
    if (!existing) return null;

    const { leagueIds, leagueSeasons, conferences, ...fields } = data;

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

    // Conferences reconcile by id (rename-safe) and, on single-league seasons,
    // roster+assign any selected teams. `undefined` = leave untouched; `[]` = clear.
    return await prisma.$transaction(async (tx) => {
      if (leagueSeasons) {
        await reconcileLeagueSeasons(tx, id, leagueSeasons);
      } else if (leagueIds) {
        await tx.leagueSeason.deleteMany({
          where: { seasonId: id, leagueId: { notIn: leagueIds } },
        });
        for (const leagueId of leagueIds) {
          await tx.leagueSeason.upsert({
            where: { leagueId_seasonId: { leagueId, seasonId: id } },
            create: {
              leagueId,
              seasonId: id,
              startDate: updateData.startDate ?? existing.startDate,
              endDate: updateData.endDate ?? existing.endDate,
              registrationOpensAt:
                'registrationOpensAt' in fields
                  ? updateData.registrationOpensAt
                  : existing.registrationOpensAt,
              registrationClosesAt:
                'registrationClosesAt' in fields
                  ? updateData.registrationClosesAt
                  : existing.registrationClosesAt,
              bracketType: fields.bracketType ?? existing.bracketType,
              status: fields.active === false ? 'COMPLETED' : 'ACTIVE',
            },
            update: {},
          });
        }
      }
      if (!leagueSeasons && conferences) {
        const effectiveLeagueIds =
          leagueIds ??
          (await tx.leagueSeason.findMany({
            where: { seasonId: id },
            select: { leagueId: true },
          })).map((row) => row.leagueId);
        const scope = await singleLeagueSeason(tx, id, effectiveLeagueIds);
        if (!scope) throw new Error('Conferences require exactly one league competition.');
        await reconcileConferences(tx, id, conferences, scope);
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
