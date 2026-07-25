import type { Prisma } from '@prisma/client';
import { prisma } from '../../../../../lib/prisma';
import { resolveLeagueSeasonById } from '../../../../seasons/data/league-season-scope';

export interface ConferenceSummary {
  id: string;
  name: string;
}

/**
 * Set the exact team membership of a conference among the season's rostered
 * teams: every id in `teamIds` is assigned to it (moved from any other
 * conference), and any team currently in it but absent from `teamIds` is
 * unassigned. Only affects rostered teams — a (seasonId, teamId) with no roster
 * row simply matches nothing. Runs in the caller's transaction client.
 */
async function syncConferenceTeams(
  tx: Prisma.TransactionClient,
  leagueSeasonId: string,
  conferenceId: string,
  teamIds: string[],
): Promise<void> {
  const unique = [...new Set(teamIds.filter(Boolean))];

  if (unique.length) {
    await tx.seasonTeam.updateMany({
      where: { leagueSeasonId, teamId: { in: unique } },
      data: { conferenceId },
    });
  }

  await tx.seasonTeam.updateMany({
    where: {
      leagueSeasonId,
      conferenceId,
      ...(unique.length ? { teamId: { notIn: unique } } : {}),
    },
    data: { conferenceId: null },
  });
}

/**
 * Create a conference on a season and optionally seed its team membership.
 * New rows sort after the existing ones. Returns the created conference.
 * Throws Prisma P2002 if the name collides within the season.
 */
export async function createConference(
  leagueSeasonId: string,
  name: string,
  teamIds: string[] = [],
  expectedSeasonId?: string,
): Promise<ConferenceSummary> {
  const scope = await resolveLeagueSeasonById(leagueSeasonId, { seasonId: expectedSeasonId });
  return await prisma.$transaction(async (tx) => {
    const sortOrder = await tx.conference.count({ where: { leagueSeasonId: scope.leagueSeasonId } });
    const conference = await tx.conference.create({
      data: { seasonId: scope.seasonId, leagueSeasonId: scope.leagueSeasonId, name, sortOrder },
      select: { id: true, name: true },
    });
    if (teamIds.length) await syncConferenceTeams(tx, scope.leagueSeasonId, conference.id, teamIds);
    return conference;
  });
}

/**
 * Rename a conference and/or replace its team membership. `name`/`teamIds` are
 * each optional — pass only what changed. Returns false if the conference isn't
 * part of this season. Throws Prisma P2002 on a name collision.
 */
export async function updateConference(
  seasonId: string,
  conferenceId: string,
  changes: { name?: string; teamIds?: string[] },
): Promise<boolean> {
  const existing = await prisma.conference.findFirst({
    where: { id: conferenceId, seasonId },
    select: { id: true, leagueSeasonId: true },
  });
  if (!existing) return false;

  await prisma.$transaction(async (tx) => {
    if (changes.name !== undefined) {
      await tx.conference.update({ where: { id: conferenceId }, data: { name: changes.name } });
    }
    if (changes.teamIds !== undefined) {
      await syncConferenceTeams(tx, existing.leagueSeasonId, conferenceId, changes.teamIds);
    }
  });
  return true;
}

/**
 * Delete a conference. Its teams are unassigned (SetNull), never removed.
 * Returns false if the conference isn't part of this season.
 */
export async function deleteConference(seasonId: string, conferenceId: string): Promise<boolean> {
  const result = await prisma.conference.deleteMany({ where: { id: conferenceId, seasonId } });
  return result.count > 0;
}
