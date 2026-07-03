/**
 * One-shot script to categorise legacy matches that have no `stage`.
 *
 * Match stage is now compulsory (enforced in the admin form and the match API),
 * so any pre-existing stage-less match would otherwise block edits until a stage
 * is picked. This backfills them with a sensible default so nobody hits that
 * wall mid-edit.
 *
 * Usage:
 *   npx tsx scripts/backfill-match-stages.ts                 # writes REGULAR_SEASON
 *   npx tsx scripts/backfill-match-stages.ts --dry-run       # logs only, no writes
 *   npx tsx scripts/backfill-match-stages.ts --stage=OTHER   # use a different default
 *
 * Idempotent: only matches with a null stage are touched. Playoff stages are
 * never assigned here — those must be set deliberately so the bracket stays
 * correct.
 */

import { PrismaClient } from '@prisma/client';
import type { MatchStage } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { config } from 'dotenv';

config();

// Stages a legacy uncategorised match may safely be defaulted to. Playoff
// stages are intentionally excluded — assigning them blindly would corrupt
// brackets and standings.
const ALLOWED_DEFAULTS: MatchStage[] = ['REGULAR_SEASON', 'PRESEASON', 'EXHIBITION', 'OTHER'];
const DEFAULT_STAGE: MatchStage = 'REGULAR_SEASON';

function parseArgs(argv: string[]): { dryRun: boolean; stage: MatchStage } {
  const dryRun = argv.includes('--dry-run');

  const stageArg = argv.find((a) => a.startsWith('--stage='));
  let stage: MatchStage = DEFAULT_STAGE;
  if (stageArg) {
    const value = stageArg.split('=')[1]?.trim().toUpperCase() as MatchStage;
    if (!ALLOWED_DEFAULTS.includes(value)) {
      throw new Error(
        `Invalid --stage="${value}". Allowed defaults: ${ALLOWED_DEFAULTS.join(', ')}.`,
      );
    }
    stage = value;
  }

  return { dryRun, stage };
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL environment variable is not set. ' +
        'Please configure it in your .env file or environment variables.',
    );
  }

  const url = new URL(connectionString);
  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: parseInt(url.port) || 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    connectionLimit: 5,
    idleTimeout: 30000,
    connectTimeout: 15000,
  });

  return new PrismaClient({ adapter, log: ['error', 'warn'] });
}

async function main() {
  const { dryRun, stage } = parseArgs(process.argv.slice(2));
  const prisma = createPrismaClient();

  console.log('Starting match stage backfill...');
  console.log(`Default stage for uncategorised matches: ${stage}`);
  if (dryRun) console.log('Running in dry-run mode (no database updates).');

  try {
    const matches = await prisma.match.findMany({
      where: { stage: null },
      select: { id: true, team1Name: true, team2Name: true, date: true },
      orderBy: { date: 'asc' },
    });

    console.log(`Matches missing a stage: ${matches.length}`);

    if (matches.length === 0) {
      console.log('Nothing to backfill.');
      return;
    }

    if (dryRun) {
      for (const m of matches) {
        const label = [m.team1Name, m.team2Name].filter(Boolean).join(' vs ') || '(no team names)';
        console.log(`[DRY RUN] ${m.id} (${label}) -> ${stage}`);
      }
      console.log(`\n[DRY RUN] Would update ${matches.length} match(es) to ${stage}.`);
      return;
    }

    // Single bulk update — all target rows get the same default stage.
    const result = await prisma.match.updateMany({
      where: { stage: null },
      data: { stage },
    });

    console.log('Backfill complete.');
    console.log(`Matches updated: ${result.count}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Match stage backfill failed:', error);
  process.exit(1);
});
