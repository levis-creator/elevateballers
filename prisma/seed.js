import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

// Load environment variables
config();

/**
 * Hash a password using bcrypt
 */
async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

/**
 * Create Prisma client with MariaDB adapter
 */
function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL environment variable is not set. ' +
      'Please configure it in your .env file or environment variables.'
    );
  }

  // Parse MySQL connection string
  let poolConfig;

  try {
    const url = new URL(connectionString);

    poolConfig = {
      host: url.hostname,
      port: parseInt(url.port) || 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.slice(1), // Remove leading '/'
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

const prisma = createPrismaClient();

/**
 * Seed admin user
 */
async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@elevateballers.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const name = process.env.ADMIN_NAME || 'Admin User';

  console.log('\n🌱 Seeding admin user...');
  console.log(`Email: ${email}`);
  console.log(`Name: ${name}`);

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email },
  });

  if (existingAdmin) {
    console.log(`⚠️  Admin user with email "${email}" already exists.`);

    // Update password if provided via env var (useful for resetting password)
    if (process.env.ADMIN_PASSWORD) {
      const hashedPassword = await hashPassword(password);
      await prisma.user.update({
        where: { email },
        data: {
          passwordHash: hashedPassword,
          name,
          role: 'ADMIN',
        },
      });
      console.log('✅ Admin user password updated!');
    } else {
      console.log('ℹ️  Skipping creation. Set ADMIN_PASSWORD env var to update password.');
    }

    return existingAdmin;
  }

  // Create new admin user
  const hashedPassword = await hashPassword(password);

  const admin = await prisma.user.create({
    data: {
      email,
      passwordHash: hashedPassword,
      name,
      role: 'ADMIN',
    },
  });

  console.log('✅ Admin user created successfully!');
  console.log(`   User ID: ${admin.id}`);
  console.log(`   Email: ${admin.email}`);
  console.log(`   Role: ${admin.role}`);

  return admin;
}

/**
 * Seed teams
 */
async function seedTeams() {
  console.log('\n🏀 Seeding teams...');

  const teams = [
    { name: 'Thunder Hawks', slug: 'thunder-hawks', nickname: 'Hawks', description: 'Elite basketball team known for fast-paced gameplay' },
    { name: 'Fire Dragons', slug: 'fire-dragons', nickname: 'Dragons', description: 'Fierce competitors with strong defense' },
    { name: 'Storm Riders', slug: 'storm-riders', nickname: 'Riders', description: 'Dynamic team with excellent teamwork' },
    { name: 'Lightning Bolts', slug: 'lightning-bolts', nickname: 'Bolts', description: 'Quick and agile players' },
    { name: 'Eagle Warriors', slug: 'eagle-warriors', nickname: 'Warriors', description: 'Strategic and disciplined team' },
    { name: 'Phoenix Rising', slug: 'phoenix-rising', nickname: 'Phoenix', description: 'Resilient and determined players' },
    { name: 'Tiger Claws', slug: 'tiger-claws', nickname: 'Tigers', description: 'Aggressive offensive team' },
    { name: 'Wolf Pack', slug: 'wolf-pack', nickname: 'Wolves', description: 'Team-oriented with strong communication' },
    { name: 'Lion Pride', slug: 'lion-pride', nickname: 'Lions', description: 'Dominant and powerful players' },
    { name: 'Bear Force', slug: 'bear-force', nickname: 'Bears', description: 'Physical and strong team' },
    { name: 'Shark Attack', slug: 'shark-attack', nickname: 'Sharks', description: 'Relentless and focused competitors' },
    { name: 'Panther Strike', slug: 'panther-strike', nickname: 'Panthers', description: 'Sleek and efficient team' },
  ];

  const createdTeams = [];

  for (const team of teams) {
    const existing = await prisma.team.findUnique({
      where: { slug: team.slug },
    });

    if (existing) {
      console.log(`   ⚠️  Team "${team.name}" already exists`);
      createdTeams.push(existing);
    } else {
      const created = await prisma.team.create({
        data: {
          ...team,
          approved: true,
        },
      });
      console.log(`   ✅ Created team: ${team.name}`);
      createdTeams.push(created);
    }
  }

  console.log(`✅ Teams seeded: ${createdTeams.length} teams`);
  return createdTeams;
}

/**
 * Seed leagues
 */
async function seedLeagues() {
  console.log('\n🏆 Seeding leagues...');

  const leagues = [
    { name: 'Ballers League', slug: 'ballers-league', description: 'Premier basketball league', active: true },
    { name: 'Junior Ballers', slug: 'junior-ballers', description: 'Youth basketball league', active: true },
    { name: 'Senior Ballers', slug: 'senior-ballers', description: 'Senior division league', active: true },
    { name: 'Women\'s League', slug: 'womens-league', description: 'Women\'s basketball league', active: true },
  ];

  const createdLeagues = [];

  for (const league of leagues) {
    const existing = await prisma.league.findUnique({
      where: { slug: league.slug },
    });

    if (existing) {
      console.log(`   ⚠️  League "${league.name}" already exists`);
      createdLeagues.push(existing);
    } else {
      const created = await prisma.league.create({
        data: league,
      });
      console.log(`   ✅ Created league: ${league.name}`);
      createdLeagues.push(created);
    }
  }

  console.log(`✅ Leagues seeded: ${createdLeagues.length} leagues`);
  return createdLeagues;
}

/**
 * Seed seasons
 */
async function seedSeasons(leagues) {
  console.log('\n📅 Seeding seasons...');

  const seasons = [];
  const currentYear = new Date().getFullYear();

  for (const league of leagues) {
    const seasonData = {
      name: `${currentYear} Season`,
      slug: `${currentYear}-season`,
      description: `${currentYear} basketball season for ${league.name}`,
      startDate: new Date(`${currentYear}-01-01`),
      endDate: new Date(`${currentYear}-12-31`),
      active: true,
      leagueId: league.id,
    };

    const existing = await prisma.season.findFirst({
      where: {
        leagueId: league.id,
        slug: seasonData.slug,
      },
    });

    if (existing) {
      console.log(`   ⚠️  Season "${seasonData.name}" for "${league.name}" already exists`);
      seasons.push(existing);
    } else {
      const created = await prisma.season.create({
        data: seasonData,
      });
      console.log(`   ✅ Created season: ${seasonData.name} for ${league.name}`);
      seasons.push(created);
    }
  }

  console.log(`✅ Seasons seeded: ${seasons.length} seasons`);
  return seasons;
}

/**
 * Seed matches (fixtures)
 */
async function seedMatches(teams, leagues, seasons) {
  console.log('\n⚽ Seeding matches...');

  // Helper to get random item from array
  const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // Helper to get two different teams
  const getTwoTeams = () => {
    const team1 = random(teams);
    let team2 = random(teams);
    while (team2.id === team1.id) {
      team2 = random(teams);
    }
    return [team1, team2];
  };

  // Generate matches for the next 30 days
  const matches = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Create 20 upcoming matches
  for (let i = 0; i < 20; i++) {
    const [team1, team2] = getTwoTeams();
    const league = random(leagues);
    const season = seasons.find(s => s.leagueId === league.id);

    if (!season) continue;

    // Spread matches over next 30 days
    const daysAhead = Math.floor(Math.random() * 30);
    const matchDate = new Date(today);
    matchDate.setDate(matchDate.getDate() + daysAhead);

    // Random time between 10:00 and 20:00
    const hour = 10 + Math.floor(Math.random() * 10);
    matchDate.setHours(hour, 0, 0, 0);

    matches.push({
      team1Id: team1.id,
      team1Name: team1.name,
      team2Id: team2.id,
      team2Name: team2.name,
      date: matchDate,
      status: 'UPCOMING',
      leagueId: league.id,
      leagueName: league.name,
      seasonId: season.id,
      stage: random(['REGULAR_SEASON', 'PLAYOFF', 'QUARTER_FINALS', 'SEMI_FINALS', 'CHAMPIONSHIP']),
    });
  }

  // Create 10 completed matches (past dates)
  for (let i = 0; i < 10; i++) {
    const [team1, team2] = getTwoTeams();
    const league = random(leagues);
    const season = seasons.find(s => s.leagueId === league.id);

    if (!season) continue;

    // Past dates (last 30 days)
    const daysAgo = Math.floor(Math.random() * 30) + 1;
    const matchDate = new Date(today);
    matchDate.setDate(matchDate.getDate() - daysAgo);

    const hour = 10 + Math.floor(Math.random() * 10);
    matchDate.setHours(hour, 0, 0, 0);

    // Random scores
    const team1Score = Math.floor(Math.random() * 50) + 60;
    const team2Score = Math.floor(Math.random() * 50) + 60;

    matches.push({
      team1Id: team1.id,
      team1Name: team1.name,
      team1Score,
      team2Id: team2.id,
      team2Name: team2.name,
      team2Score,
      date: matchDate,
      status: 'COMPLETED',
      leagueId: league.id,
      leagueName: league.name,
      seasonId: season.id,
      stage: random(['REGULAR_SEASON', 'PLAYOFF', 'QUARTER_FINALS', 'SEMI_FINALS', 'CHAMPIONSHIP']),
      winnerId: team1Score > team2Score ? team1.id : team2.id,
    });
  }

  // Insert matches
  let createdCount = 0;
  for (const match of matches) {
    try {
      await prisma.match.create({
        data: match,
      });
      createdCount++;
    } catch (error) {
      // Skip if duplicate
      console.log(`   ⚠️  Skipped duplicate match`);
    }
  }

  console.log(`✅ Matches seeded: ${createdCount} matches created`);
  return createdCount;
}

/**
 * Main seed function
 */
async function main() {
  console.log('🚀 Starting database seeding...\n');

  try {
    // Seed admin user
    await seedAdmin();

    // Seed teams
    const teams = await seedTeams();

    // Seed leagues
    const leagues = await seedLeagues();

    // Seed seasons
    const seasons = await seedSeasons(leagues);

    // Seed matches
    await seedMatches(teams, leagues, seasons);

    console.log('\n✅ Seeding completed successfully!');
    console.log('\n📝 Login credentials:');
    console.log(`   Email: ${process.env.ADMIN_EMAIL || 'admin@elevateballers.com'}`);
    console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'admin123'}`);
    console.log('\n⚠️  Remember to change the default password after first login!');
  } catch (error) {
    console.error('\n❌ Error during seeding:', error);
    throw error;
  }
}

// Run seed
main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
