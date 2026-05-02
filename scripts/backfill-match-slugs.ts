/**
 * One-shot script to populate the new `slug` column on existing matches.
 * Run after applying the 20260503000000_add_match_slug Prisma migration.
 *
 * Usage:
 *   npx tsx scripts/backfill-match-slugs.ts            # writes to DB
 *   npx tsx scripts/backfill-match-slugs.ts --dry-run  # logs only
 *
 * Idempotent: matches that already have a slug are skipped. Uses team1/team2
 * names + match date to build a human-readable URL fragment, falling back to
 * "match-{shortId}" when team info is missing. Collisions get -2/-3 suffixes.
 */

import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { config } from 'dotenv';

config();

const MATCH_TIMEZONE = 'America/New_York';

function slugifyFragment(input: string | null | undefined): string {
  if (!input) return '';
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function dateSlugFragment(date: Date | null): string {
  if (!date || Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: MATCH_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function buildBaseSlug(opts: {
  team1Slug: string | null;
  team2Slug: string | null;
  team1Name: string | null;
  team2Name: string | null;
  date: Date | null;
  fallbackId: string;
}): string {
  const t1 = slugifyFragment(opts.team1Slug) || slugifyFragment(opts.team1Name);
  const t2 = slugifyFragment(opts.team2Slug) || slugifyFragment(opts.team2Name);
  const datePart = dateSlugFragment(opts.date);
  if (t1 && t2) {
    return [t1, 'vs', t2, datePart].filter(Boolean).join('-');
  }
  const idTail = opts.fallbackId.slice(-8);
  return `match-${idTail}`;
}

function makeUniqueSlug(base: string, taken: Set<string>): string {
  if (!taken.has(base)) {
    taken.add(base);
    return base;
  }
  let counter = 2;
  while (taken.has(`${base}-${counter}`)) {
    counter += 1;
  }
  const unique = `${base}-${counter}`;
  taken.add(unique);
  return unique;
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
  const dryRun = process.argv.slice(2).includes('--dry-run');
  const prisma = createPrismaClient();

  console.log('Starting match slug backfill...');
  if (dryRun) console.log('Running in dry-run mode (no database updates).');

  try {
    const existing = await prisma.match.findMany({
      where: { slug: { not: null } },
      select: { slug: true },
    });
    const taken = new Set<string>(
      existing.map((m) => m.slug).filter((s): s is string => Boolean(s)),
    );

    const matches = await prisma.match.findMany({
      where: { OR: [{ slug: null }, { slug: '' }] },
      include: { team1: { select: { slug: true, name: true } }, team2: { select: { slug: true, name: true } } },
      orderBy: { date: 'asc' },
    });

    console.log(`Matches missing slugs: ${matches.length}`);

    let updated = 0;
    for (const m of matches) {
      const base = buildBaseSlug({
        team1Slug: m.team1?.slug ?? null,
        team2Slug: m.team2?.slug ?? null,
        team1Name: m.team1Name ?? m.team1?.name ?? null,
        team2Name: m.team2Name ?? m.team2?.name ?? null,
        date: m.date,
        fallbackId: m.id,
      });
      const slug = makeUniqueSlug(base, taken);

      if (dryRun) {
        console.log(`[DRY RUN] ${m.id} -> ${slug}`);
      } else {
        await prisma.match.update({ where: { id: m.id }, data: { slug } });
      }
      updated += 1;
    }

    console.log('Backfill complete.');
    console.log(`Matches updated: ${updated}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Match slug backfill failed:', error);
  process.exit(1);
});
