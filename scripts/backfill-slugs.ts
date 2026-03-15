import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { config } from 'dotenv';

config();

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL environment variable is not set. ' +
      'Please configure it in your .env file or environment variables.'
    );
  }

  let poolConfig: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    connectionLimit?: number;
    idleTimeout?: number;
    connectTimeout?: number;
  };

  try {
    const url = new URL(connectionString);

    poolConfig = {
      host: url.hostname,
      port: parseInt(url.port) || 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.slice(1),
      connectionLimit: 5,
      idleTimeout: 30000,
      connectTimeout: 15000,
    };
  } catch (error) {
    throw new Error(
      `Invalid DATABASE_URL format: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
      'Expected format: mysql://user:password@host:port/database'
    );
  }

  const adapter = new PrismaMariaDb(poolConfig);

  return new PrismaClient({
    adapter,
    log: ['error', 'warn'],
  });
}

type Options = {
  dryRun: boolean;
};

function parseArgs(): Options {
  const args = new Set(process.argv.slice(2));
  return {
    dryRun: args.has('--dry-run'),
  };
}

function makeUniqueSlug(base: string, existing: Set<string>): string {
  let slug = generateSlug(base);
  if (!slug) slug = 'item';
  if (!existing.has(slug)) {
    existing.add(slug);
    return slug;
  }

  let counter = 2;
  while (existing.has(`${slug}-${counter}`)) {
    counter += 1;
  }
  const unique = `${slug}-${counter}`;
  existing.add(unique);
  return unique;
}

async function main() {
  const { dryRun } = parseArgs();
  const prisma = createPrismaClient();

  console.log('Starting slug backfill...');
  if (dryRun) {
    console.log('Running in dry-run mode (no database updates).');
  }

  try {
    const [playerSlugs, staffSlugs] = await Promise.all([
      prisma.player.findMany({
        where: { slug: { not: null } },
        select: { slug: true },
      }),
      prisma.staff.findMany({
        where: { slug: { not: null } },
        select: { slug: true },
      }),
    ]);

    const existingPlayerSlugs = new Set(
      playerSlugs.map((p) => p.slug).filter((s): s is string => Boolean(s))
    );
    const existingStaffSlugs = new Set(
      staffSlugs.map((s) => s.slug).filter((s): s is string => Boolean(s))
    );

    const players = await prisma.player.findMany({
      where: {
        OR: [{ slug: null }, { slug: '' }],
      },
      select: { id: true, firstName: true, lastName: true },
    });

    const staff = await prisma.staff.findMany({
      where: {
        OR: [{ slug: null }, { slug: '' }],
      },
      select: { id: true, firstName: true, lastName: true },
    });

    console.log(`Players missing slugs: ${players.length}`);
    console.log(`Staff missing slugs: ${staff.length}`);

    let updatedPlayers = 0;
    for (const player of players) {
      const baseName = `${player.firstName ?? ''} ${player.lastName ?? ''}`.trim() || 'player';
      const slug = makeUniqueSlug(baseName, existingPlayerSlugs);
      if (dryRun) {
        console.log(`[DRY RUN] player ${player.id} -> ${slug}`);
      } else {
        await prisma.player.update({
          where: { id: player.id },
          data: { slug },
        });
      }
      updatedPlayers += 1;
    }

    let updatedStaff = 0;
    for (const member of staff) {
      const baseName = `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim() || 'staff';
      const slug = makeUniqueSlug(baseName, existingStaffSlugs);
      if (dryRun) {
        console.log(`[DRY RUN] staff ${member.id} -> ${slug}`);
      } else {
        await prisma.staff.update({
          where: { id: member.id },
          data: { slug },
        });
      }
      updatedStaff += 1;
    }

    console.log('Backfill complete.');
    console.log(`Players updated: ${updatedPlayers}`);
    console.log(`Staff updated: ${updatedStaff}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Slug backfill failed:', error);
  process.exit(1);
});
