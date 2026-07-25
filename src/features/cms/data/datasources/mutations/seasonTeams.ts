import { prisma } from '../../../../../lib/prisma';
import {
  resolveLeagueSeasonScope,
  type LeagueSeasonScopeInput,
} from '../../../../seasons/data/league-season-scope';

/**
 * Register teams into a specific (season, league). Idempotent — the
 * (seasonId, teamId) unique constraint means already-present teams are
 * skipped. Returns how many new rows were created.
 */
export async function addSeasonTeams(
  seasonId: string,
  leagueId: string,
  teamIds: string[],
  leagueSeasonId?: string,
): Promise<number> {
  const unique = [...new Set(teamIds.filter(Boolean))];
  if (unique.length === 0) return 0;
  const scope = await resolveLeagueSeasonScope({ leagueSeasonId, seasonId, leagueId });

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
export async function removeSeasonTeam(seasonId: string, teamId: string): Promise<boolean> {
  const result = await prisma.seasonTeam.deleteMany({ where: { seasonId, teamId } });
  return result.count > 0;
}

/**
 * Assign (or clear) a rostered team's conference. Passing `null` unassigns.
 * When a conference id is given it must belong to this same season — a
 * cross-season id is rejected rather than silently stored. Returns true if a
 * roster row was updated (false when the team isn't rostered in the season).
 */
export async function setSeasonTeamConference(
  seasonId: string,
  teamId: string,
  conferenceId: string | null,
  leagueSeasonId?: string,
): Promise<boolean> {
  let scope: LeagueSeasonScopeInput = { seasonId, leagueSeasonId };
  if (conferenceId) {
    const conference = await prisma.conference.findFirst({
      where: { id: conferenceId, seasonId },
      select: { id: true, leagueSeasonId: true },
    });
    if (!conference) return false;
    scope = { seasonId, leagueSeasonId: conference.leagueSeasonId ?? leagueSeasonId };
  }
  const resolved = await resolveLeagueSeasonScope(scope);

  const result = await prisma.seasonTeam.updateMany({
    where: { leagueSeasonId: resolved.leagueSeasonId, teamId },
    data: { conferenceId },
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
