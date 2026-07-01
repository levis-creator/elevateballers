import { prisma } from '../../../../../lib/prisma';

/**
 * Register teams into a season. Idempotent — the (seasonId, teamId) unique
 * constraint means already-present teams are skipped. Returns how many new
 * rows were created.
 */
export async function addSeasonTeams(seasonId: string, teamIds: string[]): Promise<number> {
  const unique = [...new Set(teamIds.filter(Boolean))];
  if (unique.length === 0) return 0;

  const result = await prisma.seasonTeam.createMany({
    data: unique.map((teamId) => ({ seasonId, teamId })),
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
    where: { seasonId },
    select: { team1Id: true, team2Id: true },
  });

  const teamIds = new Set<string>();
  for (const m of matches) {
    if (m.team1Id) teamIds.add(m.team1Id);
    if (m.team2Id) teamIds.add(m.team2Id);
  }

  return addSeasonTeams(seasonId, [...teamIds]);
}
