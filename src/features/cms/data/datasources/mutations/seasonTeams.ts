import { prisma } from '../../../../../lib/prisma';
import {
  resolveLeagueSeasonById,
  resolveLeagueSeasonScope,
} from '../../../../seasons/data/league-season-scope';

/**
 * Register teams into a specific (season, league). Idempotent — the
 * (seasonId, teamId) unique constraint means already-present teams are
 * skipped. Returns how many new rows were created.
 */
export async function addSeasonTeams(
  leagueSeasonId: string,
  teamIds: string[],
  expectedSeasonId?: string,
): Promise<number> {
  const unique = [...new Set(teamIds.filter(Boolean))];
  if (unique.length === 0) return 0;
  const scope = await resolveLeagueSeasonById(leagueSeasonId, { seasonId: expectedSeasonId });

  const result = await prisma.seasonTeam.createMany({
    data: unique.map((teamId) => ({ ...scope, teamId })),
    skipDuplicates: true,
  });
  return result.count;
}

/**
 * Remove a single team from a season's roster. Does not touch matches.
 * Returns true if a participant row was removed.
 */
export async function removeSeasonTeam(
  leagueSeasonId: string,
  teamId: string,
  expectedSeasonId?: string,
): Promise<boolean> {
  const scope = await resolveLeagueSeasonById(leagueSeasonId, { seasonId: expectedSeasonId });
  const result = await prisma.seasonTeam.deleteMany({
    where: { leagueSeasonId: scope.leagueSeasonId, teamId },
  });
  return result.count > 0;
}

/**
 * Assign (or clear) a rostered team's conference. Passing `null` unassigns.
 * When a conference id is given it must belong to this same season — a
 * cross-season id is rejected rather than silently stored. Returns true if a
 * roster row was updated (false when the team isn't rostered in the season).
 */
export async function setSeasonTeamConference(
  leagueSeasonId: string,
  teamId: string,
  conferenceId: string | null,
  expectedSeasonId?: string,
): Promise<boolean> {
  const scope = await resolveLeagueSeasonById(leagueSeasonId, { seasonId: expectedSeasonId });
  if (conferenceId) {
    const conference = await prisma.conference.findFirst({
      where: { id: conferenceId, leagueSeasonId: scope.leagueSeasonId },
      select: { id: true },
    });
    if (!conference) return false;
  }

  const result = await prisma.seasonTeam.updateMany({
    where: { leagueSeasonId: scope.leagueSeasonId, teamId },
    data: { conferenceId },
  });
  return result.count > 0;
}

/** Set homepage promotion for one team's participation in one season edition. */
export async function setSeasonTeamFeatured(
  leagueSeasonId: string,
  teamId: string,
  featured: boolean,
  expectedSeasonId?: string,
): Promise<boolean> {
  const scope = await resolveLeagueSeasonById(leagueSeasonId, { seasonId: expectedSeasonId });
  const result = await prisma.seasonTeam.updateMany({
    where: { leagueSeasonId: scope.leagueSeasonId, teamId },
    data: { featured },
  });
  return result.count > 0;
}

/**
 * Seed a season's roster from the teams already appearing in its matches.
 * Same logic as scripts/backfill-season-teams.js but scoped to one season, so
 * it can be triggered from the admin UI. Returns how many new rows were created.
 */
export async function backfillSeasonTeamsFromMatches(seasonId: string): Promise<number> {
  const matches = await prisma.match.findMany({
    where: { seasonId, leagueId: { not: null } },
    select: { leagueId: true, team1Id: true, team2Id: true },
  });

  // Roster rows are scoped to a league, so key each team by the league it
  // played in within this season. `pairs` is keyed to dedupe (league, team).
  const pairs = new Map<string, { leagueId: string; teamId: string }>();
  for (const m of matches) {
    if (!m.leagueId) continue;
    for (const teamId of [m.team1Id, m.team2Id]) {
      if (teamId) pairs.set(`${m.leagueId}:${teamId}`, { leagueId: m.leagueId, teamId });
    }
  }
  if (pairs.size === 0) return 0;

  const result = await prisma.seasonTeam.createMany({
    data: await Promise.all(
      [...pairs.values()].map(async ({ leagueId, teamId }) => ({
        ...(await resolveLeagueSeasonScope({ seasonId, leagueId })),
        teamId,
      })),
    ),
    skipDuplicates: true,
  });
  return result.count;
}
