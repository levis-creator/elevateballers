/**
 * Backfill season_teams from existing matches.
 *
 * Team participation was introduced after matches already existed. This script
 * seeds each season's roster from the distinct teams (team1Id / team2Id) that
 * already appear in that season's matches, so existing seasons aren't blank.
 *
 * Idempotent: the (league_season_id, team_id) unique constraint means re-running
 * skips rows that already exist. Default mode is read-only; pass --apply to write.
 */

import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { config } from 'dotenv';

config();
const apply = process.argv.includes('--apply');

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set.');
  }
  const url = new URL(connectionString);
  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: parseInt(url.port) || 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    connectionLimit: 5,
  });
  return new PrismaClient({ adapter, log: ['error', 'warn'] });
}

async function main() {
  const prisma = createPrismaClient();
  try {
    // Every (leagueSeasonId, teamId) pairing implied by existing matches. A
    // match contributes up to two pairings (team1 and team2); NULLs are ignored.
    // leagueId is REQUIRED on season_teams, so only matches carrying both a
    // seasonId and a leagueId qualify. Dedupe by the (seasonId, teamId) unique key.
    const matches = await prisma.match.findMany({
      where: { leagueSeasonId: { not: null } },
      select: {
        leagueSeasonId: true,
        team1Id: true,
        team2Id: true,
        leagueSeason: { select: { seasonId: true, leagueId: true } },
      },
    });

    const pairs = new Map();
    for (const m of matches) {
      for (const teamId of [m.team1Id, m.team2Id]) {
        if (m.leagueSeasonId && m.leagueSeason && teamId) {
          const key = `${m.leagueSeasonId}::${teamId}`;
          if (!pairs.has(key)) {
            pairs.set(key, {
              leagueSeasonId: m.leagueSeasonId,
              seasonId: m.leagueSeason.seasonId,
              leagueId: m.leagueSeason.leagueId,
              teamId,
            });
          }
        }
      }
    }

    const candidateRows = [...pairs.values()];
    if (candidateRows.length === 0) {
      console.log('No season/team pairings found in matches. Nothing to backfill.');
      return;
    }
    const existing = await prisma.seasonTeam.findMany({
      where: {
        leagueSeasonId: { in: [...new Set(candidateRows.map((row) => row.leagueSeasonId))] },
      },
      select: { leagueSeasonId: true, teamId: true },
    });
    const existingKeys = new Set(
      existing.map((row) => `${row.leagueSeasonId}::${row.teamId}`),
    );
    const rows = candidateRows.filter(
      (row) => !existingKeys.has(`${row.leagueSeasonId}::${row.teamId}`),
    );

    console.log(
      `${apply ? 'APPLY' : 'DRY RUN'}: ${candidateRows.length} distinct competition/team pairing(s) ` +
        `found across ${matches.length} scoped match(es); ${rows.length} missing participant row(s).`
    );
    if (rows.length === 0) {
      console.log('All fixture teams are already registered. Nothing to backfill.');
      return;
    }
    if (!apply) {
      console.log('No rows written. Re-run with --apply to create missing participants.');
      return;
    }

    const result = await prisma.seasonTeam.createMany({
      data: rows,
      skipDuplicates: true,
    });

    console.log(
      `Backfill complete: ${result.count} new participant row(s) created ` +
        `from ${rows.length} distinct competition/team pairing(s).`
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
