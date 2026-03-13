import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

config();

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL environment variable is not set. ' +
      'Please configure it in your .env file or environment variables.'
    );
  }

  let poolConfig;

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

const prisma = createPrismaClient();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i++;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values.map((v) => v.trim());
}

function loadPermissionsFromCsv() {
  const csvPath = process.env.PERMISSIONS_CSV
    ? path.resolve(process.env.PERMISSIONS_CSV)
    : path.resolve(process.cwd(), 'scripts/data/permissions.csv');

  if (!fs.existsSync(csvPath)) {
    return null;
  }

  const raw = fs.readFileSync(csvPath, 'utf8');
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return null;

  const headers = parseCsvLine(lines[0]);
  const idx = (name) => headers.indexOf(name);

  const resourceIdx = idx('resource');
  const actionIdx = idx('action');
  const descriptionIdx = idx('description');
  const categoryIdx = idx('category');

  if (resourceIdx === -1 || actionIdx === -1) return null;

  const permissions = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const resource = values[resourceIdx];
    const action = values[actionIdx];
    if (!resource || !action) continue;

    permissions.push({
      resource,
      action,
      description: descriptionIdx !== -1 ? values[descriptionIdx] || null : null,
      category: categoryIdx !== -1 ? values[categoryIdx] || null : null,
    });
  }

  return permissions;
}

// ---------------------------------------------------------------------------
// 1. Seed permissions
// ---------------------------------------------------------------------------

async function seedPermissions() {
  console.log('\n[1/6] Seeding permissions...');

  const csvPermissions = loadPermissionsFromCsv();

  if (!csvPermissions || csvPermissions.length === 0) {
    console.log('     Warning: permissions.csv not found or empty — skipping permission seeding.');
    return;
  }

  let added = 0;
  let updated = 0;

  for (const perm of csvPermissions) {
    const existing = await prisma.permission.findUnique({
      where: { resource_action: { resource: perm.resource, action: perm.action } },
    });

    if (!existing) {
      await prisma.permission.create({ data: perm });
      added++;
    } else {
      const needsUpdate =
        (perm.description && perm.description !== existing.description) ||
        (perm.category && perm.category !== existing.category);

      if (needsUpdate) {
        await prisma.permission.update({
          where: { id: existing.id },
          data: {
            description: perm.description ?? existing.description,
            category: perm.category ?? existing.category,
          },
        });
        updated++;
      }
    }
  }

  const total = await prisma.permission.count();
  console.log(`     Added ${added}, updated ${updated}. Total: ${total} permissions.`);
}

// ---------------------------------------------------------------------------
// 2. Seed roles
// ---------------------------------------------------------------------------

const ROLE_DEFINITIONS = [
  {
    name: 'Admin',
    description: 'System Administrator — full access',
    isSystem: true,
    // Admin gets ALL permissions assigned after role creation
    permissions: null,
  },
  {
    name: 'Editor',
    description: 'Edit and publish all content',
    isSystem: true,
    permissions: [
      'teams:read', 'teams:create', 'teams:update', 'teams:approve',
      'players:read', 'players:create', 'players:update', 'players:approve', 'players:view_stats',
      'matches:read', 'matches:create', 'matches:update',
      'news_articles:read', 'news_articles:create', 'news_articles:update', 'news_articles:publish',
      'media:read', 'media:create', 'media:update',
      'folders:read', 'folders:create', 'folders:update',
      'comments:read', 'comments:update', 'comments:delete',
      'leagues:read', 'seasons:read',
      'staff:read', 'staff:create', 'staff:update',
    ],
  },
  {
    name: 'Statistician',
    description: 'Track match events and statistics',
    isSystem: true,
    permissions: [
      'matches:read', 'matches:track', 'matches:manage_events', 'matches:manage_players', 'matches:view_reports',
      'teams:read', 'players:read', 'players:view_stats',
      'leagues:read', 'seasons:read',
      'game_rules:read',
      'reports:read',
    ],
  },
  {
    name: 'Content Manager',
    description: 'Manage news, media, and content',
    isSystem: true,
    permissions: [
      'news_articles:create', 'news_articles:read', 'news_articles:update', 'news_articles:delete', 'news_articles:publish',
      'media:create', 'media:read', 'media:update', 'media:delete', 'media:batch_upload',
      'folders:create', 'folders:read', 'folders:update', 'folders:delete',
      'page_contents:create', 'page_contents:read', 'page_contents:update', 'page_contents:delete',
      'potw:create', 'potw:read', 'potw:update', 'potw:delete',
      'sponsors:create', 'sponsors:read', 'sponsors:update', 'sponsors:delete',
      'comments:read', 'comments:update', 'comments:delete',
    ],
  },
  {
    name: 'Scorekeeper',
    description: 'Track matches and game events',
    isSystem: true,
    permissions: [
      'matches:read', 'matches:track', 'matches:manage_events', 'matches:manage_players',
      'teams:read', 'players:read', 'players:view_stats',
      'game_rules:read',
    ],
  },
  {
    name: 'Viewer',
    description: 'Read-only access',
    isSystem: true,
    permissions: [
      'teams:read', 'players:read', 'matches:read', 'leagues:read', 'seasons:read',
      'news_articles:read', 'media:read', 'reports:read', 'staff:read',
    ],
  },
];

async function seedRoles() {
  console.log('\n[2/6] Seeding roles...');

  const allPermissions = await prisma.permission.findMany({ select: { id: true, resource: true, action: true } });
  const permissionMap = new Map(allPermissions.map((p) => [`${p.resource}:${p.action}`, p.id]));

  for (const roleDef of ROLE_DEFINITIONS) {
    let role = await prisma.role.findUnique({ where: { name: roleDef.name } });

    if (!role) {
      role = await prisma.role.create({
        data: { name: roleDef.name, description: roleDef.description, isSystem: roleDef.isSystem },
      });
      console.log(`     Created role: ${roleDef.name}`);
    } else {
      if (!role.isSystem && roleDef.isSystem) {
        await prisma.role.update({ where: { id: role.id }, data: { isSystem: true } });
      }
      console.log(`     Role exists:  ${roleDef.name}`);
    }

    // Determine which permissions to assign
    let targetPermissionIds;

    if (roleDef.permissions === null) {
      // Admin: assign ALL permissions
      targetPermissionIds = allPermissions.map((p) => p.id);
    } else {
      targetPermissionIds = roleDef.permissions
        .map((key) => permissionMap.get(key))
        .filter(Boolean);
    }

    // Find what's already assigned
    const existing = await prisma.rolePermission.findMany({
      where: { roleId: role.id },
      select: { permissionId: true },
    });
    const assignedIds = new Set(existing.map((rp) => rp.permissionId));

    const toAdd = targetPermissionIds.filter((id) => !assignedIds.has(id));

    if (toAdd.length > 0) {
      await prisma.rolePermission.createMany({
        data: toAdd.map((permissionId) => ({ roleId: role.id, permissionId })),
        skipDuplicates: true,
      });
      console.log(`     Assigned ${toAdd.length} permissions to ${roleDef.name}.`);
    }
  }

  // Also ensure legacy ADMIN role is renamed to Admin
  const legacyAdmin = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  if (legacyAdmin) {
    await prisma.role.update({
      where: { id: legacyAdmin.id },
      data: { name: 'Admin', description: 'System Administrator — full access', isSystem: true },
    });
    console.log('     Migrated legacy "ADMIN" role to "Admin".');
  }

  const totalRoles = await prisma.role.count();
  console.log(`     Total: ${totalRoles} roles.`);
}

// ---------------------------------------------------------------------------
// 3. Seed admin user
// ---------------------------------------------------------------------------

async function seedAdmin() {
  console.log('\n[3/6] Seeding admin user...');

  const email = process.env.ADMIN_EMAIL || 'admin@elevateballers.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const name = process.env.ADMIN_NAME || 'Admin User';

  const adminRole = await prisma.role.findUnique({ where: { name: 'Admin' } });

  if (!adminRole) {
    console.log('     Warning: Admin role not found — skipping admin user creation.');
    return;
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    include: { userRoles: { select: { roleId: true } } },
  });

  if (existingUser) {
    console.log(`     User already exists: ${email}`);

    const hasAdminRole = existingUser.userRoles.some((ur) => ur.roleId === adminRole.id);
    if (!hasAdminRole) {
      await prisma.userRole.create({ data: { userId: existingUser.id, roleId: adminRole.id } });
      console.log('     Assigned Admin role to existing user.');
    }

    if (process.env.ADMIN_PASSWORD) {
      await prisma.user.update({
        where: { email },
        data: { passwordHash: await hashPassword(password), name },
      });
      console.log('     Password updated.');
    }
  } else {
    const admin = await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword(password),
        name,
        userRoles: { create: { roleId: adminRole.id } },
      },
    });

    console.log(`     Created admin user: ${admin.email} (ID: ${admin.id})`);
  }
}

// ---------------------------------------------------------------------------
// 4. Seed teams
// ---------------------------------------------------------------------------

async function seedTeams() {
  console.log('\n[4/6] Seeding teams...');

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
    const existing = await prisma.team.findUnique({ where: { slug: team.slug } });

    if (existing) {
      createdTeams.push(existing);
    } else {
      const created = await prisma.team.create({ data: { ...team, approved: true } });
      createdTeams.push(created);
    }
  }

  const newCount = createdTeams.filter((_, i) => i < teams.length).length;
  console.log(`     ${teams.length} teams ready.`);
  return createdTeams;
}

// ---------------------------------------------------------------------------
// 5. Seed leagues
// ---------------------------------------------------------------------------

async function seedLeagues() {
  console.log('\n[5/6] Seeding leagues & seasons...');

  const leagues = [
    { name: 'Ballers League', slug: 'ballers-league', description: 'Premier basketball league', active: true },
    { name: 'Junior Ballers', slug: 'junior-ballers', description: 'Youth basketball league', active: true },
    { name: 'Senior Ballers', slug: 'senior-ballers', description: 'Senior division league', active: true },
    { name: "Women's League", slug: 'womens-league', description: "Women's basketball league", active: true },
  ];

  const createdLeagues = [];

  for (const league of leagues) {
    const existing = await prisma.league.findUnique({ where: { slug: league.slug } });

    if (existing) {
      createdLeagues.push(existing);
    } else {
      const created = await prisma.league.create({ data: league });
      createdLeagues.push(created);
    }
  }

  console.log(`     ${createdLeagues.length} leagues ready.`);
  return createdLeagues;
}

// ---------------------------------------------------------------------------
// 6. Seed seasons
// ---------------------------------------------------------------------------

async function seedSeasons(leagues) {
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
      where: { leagueId: league.id, slug: seasonData.slug },
    });

    if (existing) {
      seasons.push(existing);
    } else {
      const created = await prisma.season.create({ data: seasonData });
      seasons.push(created);
    }
  }

  console.log(`     ${seasons.length} seasons ready.`);
  return seasons;
}

// ---------------------------------------------------------------------------
// Seed matches
// ---------------------------------------------------------------------------

async function seedMatches(teams, leagues, seasons) {
  console.log('\n[6/6] Seeding matches...');

  if (teams.length === 0 || leagues.length === 0 || seasons.length === 0) {
    console.log('     No teams/leagues/seasons available — skipping match seeding.');
    return;
  }

  const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const getTwoTeams = () => {
    const team1 = random(teams);
    let team2 = random(teams);
    while (team2.id === team1.id) team2 = random(teams);
    return [team1, team2];
  };

  const matches = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stages = ['REGULAR_SEASON', 'PLAYOFF', 'QUARTER_FINALS', 'SEMI_FINALS', 'CHAMPIONSHIP'];

  // 20 upcoming
  for (let i = 0; i < 20; i++) {
    const [team1, team2] = getTwoTeams();
    const league = random(leagues);
    const season = seasons.find((s) => s.leagueId === league.id);
    if (!season) continue;

    const matchDate = new Date(today);
    matchDate.setDate(matchDate.getDate() + Math.floor(Math.random() * 30));
    matchDate.setHours(10 + Math.floor(Math.random() * 10), 0, 0, 0);

    matches.push({
      team1Id: team1.id, team1Name: team1.name,
      team2Id: team2.id, team2Name: team2.name,
      date: matchDate, status: 'UPCOMING',
      leagueId: league.id, leagueName: league.name,
      seasonId: season.id, stage: random(stages),
    });
  }

  // 10 completed
  for (let i = 0; i < 10; i++) {
    const [team1, team2] = getTwoTeams();
    const league = random(leagues);
    const season = seasons.find((s) => s.leagueId === league.id);
    if (!season) continue;

    const matchDate = new Date(today);
    matchDate.setDate(matchDate.getDate() - (Math.floor(Math.random() * 30) + 1));
    matchDate.setHours(10 + Math.floor(Math.random() * 10), 0, 0, 0);

    const team1Score = Math.floor(Math.random() * 50) + 60;
    const team2Score = Math.floor(Math.random() * 50) + 60;

    matches.push({
      team1Id: team1.id, team1Name: team1.name, team1Score,
      team2Id: team2.id, team2Name: team2.name, team2Score,
      date: matchDate, status: 'COMPLETED',
      leagueId: league.id, leagueName: league.name,
      seasonId: season.id, stage: random(stages),
      winnerId: team1Score > team2Score ? team1.id : team2.id,
    });
  }

  let created = 0;
  for (const match of matches) {
    try {
      await prisma.match.create({ data: match });
      created++;
    } catch {
      // skip duplicates
    }
  }

  console.log(`     ${created} matches created.`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('Starting database seed...');

  await seedPermissions();
  await seedRoles();
  await seedAdmin();
  const teams = await seedTeams();
  const leagues = await seedLeagues();
  const seasons = await seedSeasons(leagues);
  await seedMatches(teams, leagues, seasons);

  console.log('\nSeed complete!');
  console.log(`\nAdmin login:`);
  console.log(`  Email:    ${process.env.ADMIN_EMAIL || 'admin@elevateballers.com'}`);
  console.log(`  Password: ${process.env.ADMIN_PASSWORD || 'admin123'}`);
  if (!process.env.ADMIN_PASSWORD) {
    console.log('\n  Set ADMIN_PASSWORD in .env to use a custom password.');
  }
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
