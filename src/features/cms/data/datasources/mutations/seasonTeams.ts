import { prisma } from '../../../../../lib/prisma';

/**
 * Register teams into a specific (season, league). Idempotent — the
 * (seasonId, teamId) unique constraint means already-present teams are
 * skipped. Returns how many new rows were created.
 */
export async function addSeasonTeams(seasonId: string, leagueId: string, teamIds: string[]): Promise<number> {
  const unique = [...new Set(teamIds.filter(Boolean))];
  if (unique.length === 0) return 0;

  const result = await prisma.seasonTeam.createMany({
    data: unique.map((teamId) => ({ seasonId, leagueId, teamId })),
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
    data: [...pairs.values()].map(({ leagueId, teamId }) => ({ seasonId, leagueId, teamId })),
    skipDuplicates: true,
  });
  return result.count;
}
