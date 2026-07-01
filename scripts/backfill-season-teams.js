/**
 * Backfill season_teams from existing matches.
 *
 * Team participation was introduced after matches already existed. This script
 * seeds each season's roster from the distinct teams (team1Id / team2Id) that
 * already appear in that season's matches, so existing seasons aren't blank.
 *
 * Idempotent: the (season_id, team_id) unique constraint means re-running skips
 * rows that already exist. Run with: node scripts/backfill-season-teams.js
 */

import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { config } from 'dotenv';

config();

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
    // Every (seasonId, teamId) pairing implied by existing matches. A match
    // contributes up to two pairings (team1 and team2); NULLs are ignored.
    const matches = await prisma.match.findMany({
      where: { seasonId: { not: null } },
      select: { seasonId: true, team1Id: true, team2Id: true },
    });

    const pairs = new Map(); // key `${seasonId}::${teamId}` -> { seasonId, teamId }
    for (const m of matches) {
      for (const teamId of [m.team1Id, m.team2Id]) {
        if (m.seasonId && teamId) {
          pairs.set(`${m.seasonId}::${teamId}`, { seasonId: m.seasonId, teamId });
        }
      }
    }

    const rows = [...pairs.values()];
    if (rows.length === 0) {
      console.log('No season/team pairings found in matches. Nothing to backfill.');
      return;
    }

    const result = await prisma.seasonTeam.createMany({
      data: rows,
      skipDuplicates: true,
    });

    console.log(
      `Backfill complete: ${result.count} new participant row(s) created ` +
        `from ${rows.length} distinct season/team pairing(s) across ${matches.length} match(es).`
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
