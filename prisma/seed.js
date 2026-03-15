import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { faker } from '@faker-js/faker';

config();

// ---------------------------------------------------------------------------
// Prisma client
// ---------------------------------------------------------------------------

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set.');
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
    throw new Error(`Invalid DATABASE_URL format: ${error.message}.`);
  }
  const adapter = new PrismaMariaDb(poolConfig);
  return new PrismaClient({ adapter, log: ['error', 'warn'] });
}

const prisma = createPrismaClient();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => faker.number.int({ min, max });
const chance = (probability) => Math.random() < probability;

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
    if (char === '"' && inQuotes && next === '"') { current += '"'; i++; continue; }
    if (char === '"') { inQuotes = !inQuotes; continue; }
    if (char === ',' && !inQuotes) { values.push(current); current = ''; continue; }
    current += char;
  }
  values.push(current);
  return values.map((v) => v.trim());
}

function loadPermissionsFromCsv() {
  const csvPath = process.env.PERMISSIONS_CSV
    ? path.resolve(process.env.PERMISSIONS_CSV)
    : path.resolve(process.cwd(), 'scripts/data/permissions.csv');
  if (!fs.existsSync(csvPath)) return null;
  const raw = fs.readFileSync(csvPath, 'utf8');
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
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
// [1] Permissions
// ---------------------------------------------------------------------------

async function seedPermissions() {
  console.log('\n[1] Seeding permissions...');
  const csvPermissions = loadPermissionsFromCsv();
  if (!csvPermissions || csvPermissions.length === 0) {
    console.log('    Warning: permissions.csv not found — skipping.');
    return;
  }
  let added = 0, updated = 0;
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
          data: { description: perm.description ?? existing.description, category: perm.category ?? existing.category },
        });
        updated++;
      }
    }
  }
  const total = await prisma.permission.count();
  console.log(`    Added ${added}, updated ${updated}. Total: ${total} permissions.`);
}

// ---------------------------------------------------------------------------
// [2] Roles + RolePermissions
// ---------------------------------------------------------------------------

const ROLE_DEFINITIONS = [
  { name: 'Admin', description: 'System Administrator — full access', isSystem: true, permissions: null },
  {
    name: 'Editor', description: 'Edit and publish all content', isSystem: true,
    permissions: [
      'teams:read', 'teams:create', 'teams:update', 'teams:approve',
      'players:read', 'players:create', 'players:update', 'players:approve', 'players:view_stats',
      'matches:read', 'matches:create', 'matches:update',
      'news_articles:read', 'news_articles:create', 'news_articles:update', 'news_articles:publish',
      'media:read', 'media:create', 'media:update',
      'folders:read', 'folders:create', 'folders:update',
      'comments:read', 'comments:update', 'comments:delete',
      'leagues:read', 'seasons:read', 'staff:read', 'staff:create', 'staff:update',
      'contact_messages:read', 'subscribers:read', 'subscribers:manage',
    ],
  },
  {
    name: 'Statistician', description: 'Track match events and statistics', isSystem: true,
    permissions: [
      'matches:read', 'matches:track', 'matches:manage_events', 'matches:manage_players', 'matches:view_reports',
      'teams:read', 'players:read', 'players:view_stats', 'leagues:read', 'seasons:read',
      'game_rules:read', 'reports:read',
    ],
  },
  {
    name: 'Content Manager', description: 'Manage news, media, and content', isSystem: true,
    permissions: [
      'news_articles:create', 'news_articles:read', 'news_articles:update', 'news_articles:delete', 'news_articles:publish',
      'media:create', 'media:read', 'media:update', 'media:delete', 'media:batch_upload',
      'folders:create', 'folders:read', 'folders:update', 'folders:delete',
      'page_contents:create', 'page_contents:read', 'page_contents:update', 'page_contents:delete',
      'potw:create', 'potw:read', 'potw:update', 'potw:delete',
      'sponsors:create', 'sponsors:read', 'sponsors:update', 'sponsors:delete',
      'comments:read', 'comments:update', 'comments:delete',
      'contact_messages:read', 'subscribers:read', 'subscribers:manage',
    ],
  },
  {
    name: 'Scorekeeper', description: 'Track matches and game events', isSystem: true,
    permissions: ['matches:read', 'matches:track', 'matches:manage_events', 'matches:manage_players', 'teams:read', 'players:read', 'players:view_stats', 'game_rules:read'],
  },
  {
    name: 'Viewer', description: 'Read-only access', isSystem: true,
    permissions: ['teams:read', 'players:read', 'matches:read', 'leagues:read', 'seasons:read', 'news_articles:read', 'media:read', 'reports:read', 'staff:read'],
  },
];

async function seedRoles() {
  console.log('\n[2] Seeding roles + role_permissions...');
  const allPermissions = await prisma.permission.findMany({ select: { id: true, resource: true, action: true } });
  const permissionMap = new Map(allPermissions.map((p) => [`${p.resource}:${p.action}`, p.id]));

  for (const roleDef of ROLE_DEFINITIONS) {
    let role = await prisma.role.findUnique({ where: { name: roleDef.name } });
    if (!role) {
      role = await prisma.role.create({ data: { name: roleDef.name, description: roleDef.description, isSystem: roleDef.isSystem } });
    } else if (!role.isSystem && roleDef.isSystem) {
      await prisma.role.update({ where: { id: role.id }, data: { isSystem: true } });
    }

    const targetIds = roleDef.permissions === null
      ? allPermissions.map((p) => p.id)
      : roleDef.permissions.map((k) => permissionMap.get(k)).filter(Boolean);

    const existing = await prisma.rolePermission.findMany({ where: { roleId: role.id }, select: { permissionId: true } });
    const assignedIds = new Set(existing.map((rp) => rp.permissionId));
    const toAdd = targetIds.filter((id) => !assignedIds.has(id));
    if (toAdd.length > 0) {
      await prisma.rolePermission.createMany({ data: toAdd.map((permissionId) => ({ roleId: role.id, permissionId })), skipDuplicates: true });
    }
  }

  // Migrate legacy ADMIN role
  const legacyAdmin = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  if (legacyAdmin) {
    await prisma.role.update({ where: { id: legacyAdmin.id }, data: { name: 'Admin', description: 'System Administrator — full access', isSystem: true } });
  }

  const total = await prisma.role.count();
  console.log(`    Total: ${total} roles.`);
}

// ---------------------------------------------------------------------------
// [3] Users + UserRoles
// ---------------------------------------------------------------------------

async function seedUsers() {
  console.log('\n[3] Seeding users + user_roles...');

  const roles = await prisma.role.findMany();
  const roleMap = new Map(roles.map((r) => [r.name, r]));

  const userDefs = [
    { email: process.env.ADMIN_EMAIL || 'admin@elevateballers.com', name: process.env.ADMIN_NAME || 'Admin User', password: process.env.ADMIN_PASSWORD || 'admin123', role: 'Admin' },
    { email: 'editor@elevateballers.com', name: 'Jane Editor', password: 'editor123', role: 'Editor' },
    { email: 'content@elevateballers.com', name: 'Mark Content', password: 'content123', role: 'Content Manager' },
    { email: 'stats@elevateballers.com', name: 'Sam Statistician', password: 'stats123', role: 'Statistician' },
    { email: 'score@elevateballers.com', name: 'Kim Scorekeeper', password: 'score123', role: 'Scorekeeper' },
    { email: 'viewer@elevateballers.com', name: 'Alex Viewer', password: 'viewer123', role: 'Viewer' },
  ];

  const users = [];
  for (const def of userDefs) {
    const roleRecord = roleMap.get(def.role);
    if (!roleRecord) { console.log(`    Skipping ${def.email} — role "${def.role}" not found.`); continue; }

    const existing = await prisma.user.findUnique({ where: { email: def.email }, include: { userRoles: true } });
    if (existing) {
      if (!existing.userRoles.some((ur) => ur.roleId === roleRecord.id)) {
        await prisma.userRole.create({ data: { userId: existing.id, roleId: roleRecord.id } });
      }
      if (def.email === process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
        await prisma.user.update({ where: { email: def.email }, data: { passwordHash: await hashPassword(def.password), name: def.name } });
      }
      users.push(existing);
    } else {
      const user = await prisma.user.create({
        data: {
          email: def.email,
          passwordHash: await hashPassword(def.password),
          name: def.name,
          userRoles: { create: { roleId: roleRecord.id } },
        },
      });
      users.push(user);
      console.log(`    Created user: ${user.email}`);
    }
  }

  console.log(`    ${users.length} users ready.`);
  return users;
}

// ---------------------------------------------------------------------------
// [4] GameRules
// ---------------------------------------------------------------------------

async function seedGameRules() {
  console.log('\n[4] Seeding game_rules...');

  const rules = [
    {
      name: 'Standard Rules',
      description: '4 x 10 min periods — official format',
      numberOfPeriods: 4, minutesPerPeriod: 10, overtimeLength: 5,
      halftimePeriod: 2, halftimeDurationMinutes: 15,
      timeouts60Second: 6, timeouts30Second: 2, timeoutsPerOvertime: 2,
      resetTimeoutsPerPeriod: false, foulsForBonus: 5, foulsForDoubleBonus: 10,
      enableThreePointShots: true, foulsToFoulOut: 5, displayGameClock: true,
      trackTurnoverTypes: true, trackFoulTypes: true, trackPlayingTime: true, recordShotLocations: false,
    },
    {
      name: 'Short Game',
      description: '2 x 20 min halves',
      numberOfPeriods: 2, minutesPerPeriod: 20, overtimeLength: 5,
      halftimePeriod: 1, halftimeDurationMinutes: 10,
      timeouts60Second: 4, timeouts30Second: 1, timeoutsPerOvertime: 1,
      resetTimeoutsPerPeriod: false, foulsForBonus: 7, foulsForDoubleBonus: 10,
      enableThreePointShots: true, foulsToFoulOut: 6, displayGameClock: true,
      trackTurnoverTypes: false, trackFoulTypes: false, trackPlayingTime: false, recordShotLocations: false,
    },
    {
      name: 'Youth League Rules',
      description: '4 x 8 min periods, no 3-pointers',
      numberOfPeriods: 4, minutesPerPeriod: 8, overtimeLength: 4,
      halftimePeriod: 2, halftimeDurationMinutes: 10,
      timeouts60Second: 4, timeouts30Second: 0, timeoutsPerOvertime: 1,
      resetTimeoutsPerPeriod: true, foulsForBonus: 7, foulsForDoubleBonus: 10,
      enableThreePointShots: false, foulsToFoulOut: 5, displayGameClock: true,
      trackTurnoverTypes: false, trackFoulTypes: false, trackPlayingTime: true, recordShotLocations: false,
    },
  ];

  const created = [];
  for (const rule of rules) {
    const existing = await prisma.gameRules.findFirst({ where: { name: rule.name } });
    created.push(existing ?? await prisma.gameRules.create({ data: rule }));
  }

  console.log(`    ${created.length} game rule sets ready.`);
  return created;
}

// ---------------------------------------------------------------------------
// [5] Teams
// ---------------------------------------------------------------------------

async function seedTeams() {
  console.log('\n[5] Seeding teams...');

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

  const result = [];
  for (const team of teams) {
    const existing = await prisma.team.findUnique({ where: { slug: team.slug } });
    result.push(existing ?? await prisma.team.create({ data: { ...team, approved: true } }));
  }

  console.log(`    ${result.length} teams ready.`);
  return result;
}

// ---------------------------------------------------------------------------
// [6] Players + PlayerTeamHistory + RegistrationNotification
// ---------------------------------------------------------------------------

const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'];

async function seedPlayers(teams) {
  console.log('\n[6] Seeding players + player_team_history + registration_notifications...');

  let created = 0;
  const allPlayers = [];

  for (const team of teams) {
    const existing = await prisma.player.findMany({ where: { teamId: team.id } });
    if (existing.length >= 8) {
      allPlayers.push(...existing);
      continue;
    }

    const target = randomInt(8, 12);
    const usedNums = new Set(existing.map((p) => p.jerseyNumber));

    for (let i = 0; i < target; i++) {
      const firstName = faker.person.firstName('male');
      const lastName = faker.person.lastName();
      const email = faker.internet.email({ firstName, lastName }).toLowerCase();

      let jerseyNumber;
      do { jerseyNumber = randomInt(0, 99); } while (usedNums.has(jerseyNumber));
      usedNums.add(jerseyNumber);

      const heightIn = randomInt(68, 84);
      const joinedAt = faker.date.between({ from: '2024-01-01', to: new Date() });

      const player = await prisma.player.create({
        data: {
          firstName, lastName, email,
          phone: faker.phone.number(),
          position: random(POSITIONS),
          jerseyNumber,
          height: `${Math.floor(heightIn / 12)}'${heightIn % 12}"`,
          weight: `${randomInt(170, 260)} lbs`,
          bio: faker.lorem.sentence().slice(0, 190),
          approved: true,
          teamId: team.id,
          stats: {
            pointsPerGame: +faker.number.float({ min: 2, max: 28, fractionDigits: 1 }).toFixed(1),
            assistsPerGame: +faker.number.float({ min: 0.5, max: 10, fractionDigits: 1 }).toFixed(1),
            reboundsPerGame: +faker.number.float({ min: 1, max: 14, fractionDigits: 1 }).toFixed(1),
            stealsPerGame: +faker.number.float({ min: 0, max: 3, fractionDigits: 1 }).toFixed(1),
            blocksPerGame: +faker.number.float({ min: 0, max: 3, fractionDigits: 1 }).toFixed(1),
            fieldGoalPct: +faker.number.float({ min: 0.35, max: 0.65, fractionDigits: 3 }).toFixed(3),
            threePointPct: +faker.number.float({ min: 0.25, max: 0.45, fractionDigits: 3 }).toFixed(3),
            freeThrowPct: +faker.number.float({ min: 0.55, max: 0.95, fractionDigits: 3 }).toFixed(3),
            gamesPlayed: randomInt(5, 30),
          },
        },
      });

      await prisma.playerTeamHistory.create({ data: { playerId: player.id, teamId: team.id, joinedAt } });

      await prisma.registrationNotification.create({
        data: {
          type: 'PLAYER_REGISTERED',
          teamId: team.id,
          playerId: player.id,
          message: `${firstName} ${lastName} registered for ${team.name}`,
          read: chance(0.6),
        },
      });

      allPlayers.push(player);
      created++;
    }
  }

  console.log(`    ${created} players created. ${allPlayers.length} total.`);
  return allPlayers;
}

// ---------------------------------------------------------------------------
// [7] Staff + TeamStaff + RegistrationNotification (team)
// ---------------------------------------------------------------------------

const STAFF_ROLES = ['COACH', 'ASSISTANT_COACH', 'MANAGER', 'ASSISTANT_MANAGER', 'PHYSIOTHERAPIST', 'TRAINER', 'ANALYST'];

async function seedStaff(teams) {
  console.log('\n[7] Seeding staff + team_staff...');

  const existingCount = await prisma.staff.count();
  if (existingCount >= 20) {
    console.log(`    ${existingCount} staff already exist — skipping creation.`);
    const staffPool = await prisma.staff.findMany({ take: 20 });
    return staffPool;
  }

  const staffPool = [];
  for (let i = 0; i < 20; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const s = await prisma.staff.create({
      data: {
        firstName, lastName,
        email: faker.internet.email({ firstName, lastName }).toLowerCase(),
        phone: faker.phone.number(),
        role: random(STAFF_ROLES),
        bio: faker.lorem.sentence().slice(0, 190),
      },
    });
    staffPool.push(s);
  }

  let assigned = 0;
  for (const team of teams) {
    const count = randomInt(2, 4);
    const selected = faker.helpers.arrayElements(staffPool, Math.min(count, staffPool.length));
    for (const s of selected) {
      try {
        await prisma.teamStaff.create({ data: { teamId: team.id, staffId: s.id, role: random(STAFF_ROLES) } });
        assigned++;
      } catch { /* skip duplicate */ }
    }

    const hasNotif = await prisma.registrationNotification.findFirst({ where: { type: 'TEAM_REGISTERED', teamId: team.id } });
    if (!hasNotif) {
      await prisma.registrationNotification.create({
        data: { type: 'TEAM_REGISTERED', teamId: team.id, message: `${team.name} has been registered`, read: chance(0.5) },
      });
    }
  }

  console.log(`    ${staffPool.length} staff, ${assigned} team_staff assignments created.`);
  return staffPool;
}

// ---------------------------------------------------------------------------
// [8] Leagues
// ---------------------------------------------------------------------------

async function seedLeagues() {
  console.log('\n[8] Seeding leagues...');

  const leagues = [
    { name: 'Ballers League', slug: 'ballers-league', description: 'Premier basketball league', active: true },
    { name: 'Junior Ballers', slug: 'junior-ballers', description: 'Youth basketball league', active: true },
    { name: 'Senior Ballers', slug: 'senior-ballers', description: 'Senior division league', active: true },
    { name: "Women's League", slug: 'womens-league', description: "Women's basketball league", active: true },
  ];

  const result = [];
  for (const league of leagues) {
    const existing = await prisma.league.findUnique({ where: { slug: league.slug } });
    result.push(existing ?? await prisma.league.create({ data: league }));
  }

  console.log(`    ${result.length} leagues ready.`);
  return result;
}

// ---------------------------------------------------------------------------
// [9] Seasons
// ---------------------------------------------------------------------------

async function seedSeasons(leagues) {
  console.log('\n[9] Seeding seasons...');

  const seasons = [];
  const year = new Date().getFullYear();

  for (const league of leagues) {
    const slug = `${year}-season`;
    const existing = await prisma.season.findFirst({ where: { leagueId: league.id, slug } });
    seasons.push(existing ?? await prisma.season.create({
      data: {
        name: `${year} Season`, slug,
        description: `${year} basketball season for ${league.name}`,
        startDate: new Date(`${year}-01-01`),
        endDate: new Date(`${year}-12-31`),
        active: true, leagueId: league.id,
      },
    }));
  }

  console.log(`    ${seasons.length} seasons ready.`);
  return seasons;
}

// ---------------------------------------------------------------------------
// [10] Matches
// ---------------------------------------------------------------------------

async function seedMatches(teams, leagues, seasons, gameRules) {
  console.log('\n[10] Seeding matches...');

  if (!teams.length || !leagues.length || !seasons.length) {
    console.log('    Missing dependencies — skipping.');
    return [];
  }

  const getTwoTeams = () => {
    const t1 = random(teams);
    let t2 = random(teams);
    while (t2.id === t1.id) t2 = random(teams);
    return [t1, t2];
  };

  const stages = ['REGULAR_SEASON', 'PLAYOFF', 'QUARTER_FINALS', 'SEMI_FINALS', 'CHAMPIONSHIP'];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const defs = [];

  for (let i = 0; i < 20; i++) {
    const [t1, t2] = getTwoTeams();
    const league = random(leagues);
    const season = seasons.find((s) => s.leagueId === league.id);
    if (!season) continue;
    const d = new Date(today); d.setDate(d.getDate() + randomInt(1, 30)); d.setHours(10 + randomInt(0, 9), 0, 0, 0);
    defs.push({ team1Id: t1.id, team1Name: t1.name, team2Id: t2.id, team2Name: t2.name, date: d, status: 'UPCOMING', leagueId: league.id, leagueName: league.name, seasonId: season.id, stage: random(stages), gameRulesId: random(gameRules)?.id ?? null });
  }

  for (let i = 0; i < 10; i++) {
    const [t1, t2] = getTwoTeams();
    const league = random(leagues);
    const season = seasons.find((s) => s.leagueId === league.id);
    if (!season) continue;
    const d = new Date(today); d.setDate(d.getDate() - randomInt(1, 30)); d.setHours(10 + randomInt(0, 9), 0, 0, 0);
    const s1 = randomInt(60, 110), s2 = randomInt(60, 110);
    defs.push({ team1Id: t1.id, team1Name: t1.name, team1Score: s1, team2Id: t2.id, team2Name: t2.name, team2Score: s2, date: d, status: 'COMPLETED', leagueId: league.id, leagueName: league.name, seasonId: season.id, stage: random(stages), gameRulesId: random(gameRules)?.id ?? null, winnerId: s1 > s2 ? t1.id : t2.id });
  }

  const allMatches = [];
  let created = 0;
  for (const def of defs) {
    try { const m = await prisma.match.create({ data: def }); allMatches.push(m); created++; } catch { /* skip */ }
  }

  console.log(`    ${created} matches created.`);
  return allMatches;
}

// ---------------------------------------------------------------------------
// [11] Match details: match_players, match_periods, match_events, game_states,
//      timeouts, substitutions, jump_balls, player_playing_time, event_history
// ---------------------------------------------------------------------------

async function seedMatchDetails(allPlayers) {
  console.log('\n[11] Seeding match details...');

  const completed = await prisma.match.findMany({ where: { status: 'COMPLETED', team1Score: { not: null } }, take: 10 });
  if (!completed.length) { console.log('    No completed matches — skipping.'); return; }

  let periods = 0, matchPlayers = 0, events = 0, states = 0, timeouts = 0, subs = 0, jumps = 0, playingTime = 0;

  const distribute = (total, n) => {
    const pts = [];
    let rem = total;
    for (let i = 0; i < n - 1; i++) {
      const p = Math.max(0, randomInt(Math.floor(rem / (n - i) * 0.5), Math.floor(rem / (n - i) * 1.5)));
      pts.push(Math.min(p, rem));
      rem -= pts[i];
    }
    pts.push(Math.max(0, rem));
    return pts;
  };

  for (const match of completed) {
    const already = await prisma.matchPeriod.findFirst({ where: { matchId: match.id } });
    if (already) continue;

    const t1Players = allPlayers.filter((p) => p.teamId === match.team1Id);
    const t2Players = allPlayers.filter((p) => p.teamId === match.team2Id);
    if (t1Players.length < 5 || t2Players.length < 5) continue;

    const N = 4;
    const t1Pts = distribute(match.team1Score || 80, N);
    const t2Pts = distribute(match.team2Score || 75, N);

    // MatchPeriods
    const matchStart = new Date(match.date);
    for (let p = 1; p <= N; p++) {
      const startTime = new Date(matchStart.getTime() + (p - 1) * 12 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 10 * 60 * 1000);
      await prisma.matchPeriod.create({ data: { matchId: match.id, periodNumber: p, startTime, endTime, team1Score: t1Pts[p - 1], team2Score: t2Pts[p - 1] } });
      periods++;
    }

    // MatchPlayers
    const t1Starters = faker.helpers.arrayElements(t1Players, Math.min(5, t1Players.length));
    const t1Bench = t1Players.filter((p) => !t1Starters.includes(p)).slice(0, 3);
    const t2Starters = faker.helpers.arrayElements(t2Players, Math.min(5, t2Players.length));
    const t2Bench = t2Players.filter((p) => !t2Starters.includes(p)).slice(0, 3);

    const createMPs = async (players, teamId, started) => {
      const mps = [];
      for (const player of players) {
        try {
          const mp = await prisma.matchPlayer.create({
            data: { matchId: match.id, playerId: player.id, teamId, started, position: player.position, jerseyNumber: player.jerseyNumber, isActive: false, minutesPlayed: started ? randomInt(25, 40) : randomInt(5, 20) },
          });
          mps.push(mp);
          matchPlayers++;
        } catch { /* skip */ }
      }
      return mps;
    };

    const t1StarterMPs = await createMPs(t1Starters, match.team1Id, true);
    const t1BenchMPs = await createMPs(t1Bench, match.team1Id, false);
    const t2StarterMPs = await createMPs(t2Starters, match.team2Id, true);
    const t2BenchMPs = await createMPs(t2Bench, match.team2Id, false);

    // PlayerPlayingTime (starters)
    for (const mp of [...t1StarterMPs, ...t2StarterMPs]) {
      const entryTime = new Date(match.date);
      const exitTime = new Date(entryTime.getTime() + (mp.minutesPlayed || 32) * 60 * 1000);
      try {
        await prisma.playerPlayingTime.create({ data: { matchPlayerId: mp.id, period: 1, entryTime, exitTime, secondsPlayed: (mp.minutesPlayed || 32) * 60 } });
        playingTime++;
      } catch { /* skip */ }
    }

    // JumpBall — period 1
    if (t1Starters[0] && t2Starters[0]) {
      try {
        await prisma.jumpBall.create({ data: { matchId: match.id, period: 1, player1Id: t1Starters[0].id, player2Id: t2Starters[0].id, possessionTeamId: random([match.team1Id, match.team2Id]), secondsRemaining: 600 } });
        jumps++;
      } catch { /* skip */ }
    }

    // MatchEvents (scoring)
    let t1Seq = 0, t2Seq = 0;
    const genEvents = async (pts, teamId, players, period, startMin) => {
      let rem = pts;
      let min = startMin;
      const createdEvents = [];
      while (rem > 0) {
        const player = random(players);
        let eventType, val;
        const roll = Math.random();
        if (rem >= 3 && roll < 0.2) { eventType = 'THREE_POINT_MADE'; val = 3; }
        else if (rem >= 2 && roll < 0.75) { eventType = 'TWO_POINT_MADE'; val = 2; }
        else { eventType = 'FREE_THROW_MADE'; val = 1; }
        try {
          const seq = teamId === match.team1Id ? ++t1Seq : ++t2Seq;
          const ev = await prisma.matchEvent.create({ data: { matchId: match.id, eventType, minute: min, period, secondsRemaining: randomInt(0, 590), sequenceNumber: seq, playerId: player.id, teamId } });
          createdEvents.push(ev);
          events++;
        } catch { /* skip */ }
        rem -= val;
        min = Math.min(min + randomInt(0, 2), startMin + 9);
      }
      return createdEvents;
    };

    const allEvents = [];
    for (let p = 0; p < N; p++) {
      const start = p * 10 + 1;
      const e1 = await genEvents(t1Pts[p], match.team1Id, t1Starters, p + 1, start);
      const e2 = await genEvents(t2Pts[p], match.team2Id, t2Starters, p + 1, start);
      allEvents.push(...e1, ...e2);
    }

    // EventHistory — record first few events
    for (const ev of allEvents.slice(0, 3)) {
      try {
        await prisma.eventHistory.create({ data: { matchEventId: ev.id, action: 'created', newValue: { eventType: ev.eventType, minute: ev.minute } } });
      } catch { /* skip */ }
    }

    // GameStates — one snapshot per period end
    let t1Run = 0, t2Run = 0;
    for (let p = 1; p <= N; p++) {
      t1Run += t1Pts[p - 1]; t2Run += t2Pts[p - 1];
      try {
        await prisma.gameState.create({ data: { matchId: match.id, period: p, clockSeconds: 0, clockRunning: false, team1Score: t1Run, team2Score: t2Run, snapshot: { period: p, t1: t1Run, t2: t2Run } } });
        states++;
      } catch { /* skip */ }
    }

    // Timeouts — 1–2 per team
    for (const teamId of [match.team1Id, match.team2Id]) {
      for (let t = 0; t < randomInt(1, 2); t++) {
        try {
          await prisma.timeout.create({ data: { matchId: match.id, teamId, period: randomInt(1, 4), timeoutType: random(['SIXTY_SECOND', 'THIRTY_SECOND']), secondsRemaining: randomInt(60, 550) } });
          timeouts++;
        } catch { /* skip */ }
      }
    }

    // Substitutions
    for (const [starterMPs, benchMPs, teamId] of [
      [t1StarterMPs, t1BenchMPs, match.team1Id],
      [t2StarterMPs, t2BenchMPs, match.team2Id],
    ]) {
      const count = randomInt(1, Math.min(2, benchMPs.length));
      for (let s = 0; s < count; s++) {
        const playerIn = benchMPs[s];
        const playerOut = starterMPs[s % starterMPs.length];
        if (!playerIn || !playerOut) continue;
        try {
          await prisma.substitution.create({ data: { matchId: match.id, teamId, playerInId: playerIn.playerId, playerOutId: playerOut.playerId, period: randomInt(2, 4), secondsRemaining: randomInt(60, 500) } });
          subs++;
        } catch { /* skip */ }
      }
    }
  }

  console.log(`    Periods: ${periods}, MatchPlayers: ${matchPlayers}, Events: ${events}, GameStates: ${states}`);
  console.log(`    Timeouts: ${timeouts}, Subs: ${subs}, JumpBalls: ${jumps}, PlayingTime: ${playingTime}`);
}

// ---------------------------------------------------------------------------
// [12] Folders
// ---------------------------------------------------------------------------

async function seedFolders() {
  console.log('\n[12] Seeding folders...');

  const defs = [
    { name: 'Teams', path: '/uploads/teams', isPrivate: false, description: 'Team logos and photos' },
    { name: 'Players', path: '/uploads/players', isPrivate: false, description: 'Player profile photos' },
    { name: 'News', path: '/uploads/news', isPrivate: false, description: 'News article images' },
    { name: 'General', path: '/uploads/general', isPrivate: false, description: 'General site media' },
    { name: 'Private', path: '/uploads/private', isPrivate: true, description: 'Private documents' },
  ];

  const folders = [];
  for (const def of defs) {
    const existing = await prisma.folder.findUnique({ where: { path: def.path } });
    folders.push(existing ?? await prisma.folder.create({ data: def }));
  }

  console.log(`    ${folders.length} folders ready.`);
  return folders;
}

// ---------------------------------------------------------------------------
// [13] Media
// ---------------------------------------------------------------------------

async function seedMedia(folders, users) {
  console.log('\n[13] Seeding media...');

  const existing = await prisma.media.count();
  if (existing >= 15) {
    console.log(`    ${existing} media items already exist — skipping.`);
    return prisma.media.findMany({ take: 20 });
  }

  const publicFolders = folders.filter((f) => !f.isPrivate);
  const uploader = users[0];
  const items = [];

  for (let i = 0; i < 20; i++) {
    const type = i < 16 ? 'IMAGE' : 'VIDEO';
    const w = random([400, 600, 800, 1200]);
    const h = random([300, 400, 600, 800]);
    const m = await prisma.media.create({
      data: {
        title: faker.lorem.words({ min: 2, max: 5 }),
        url: `https://picsum.photos/${w}/${h}?random=${i + 1}`,
        type,
        thumbnail: `https://picsum.photos/200/150?random=${i + 1}`,
        tags: [faker.lorem.word(), faker.lorem.word()],
        folderId: random(publicFolders).id,
        uploadedBy: uploader?.id ?? null,
        featured: i < 3,
        isPrivate: false,
        mimeType: type === 'IMAGE' ? 'image/jpeg' : 'video/mp4',
        size: randomInt(50000, 5000000),
      },
    });
    items.push(m);
  }

  console.log(`    ${items.length} media items created.`);
  return items;
}

// ---------------------------------------------------------------------------
// [14] NewsArticles + Comments + FileUsages
// ---------------------------------------------------------------------------

async function seedNewsArticles(users, media) {
  console.log('\n[14] Seeding news_articles + comments + file_usages...');

  const existing = await prisma.newsArticle.count();
  if (existing >= 10) { console.log(`    ${existing} articles already exist — skipping.`); return; }

  const categories = ['INTERVIEWS', 'CHAMPIONSHIPS', 'MATCH_REPORT', 'ANALYSIS'];
  let articleCount = 0, commentCount = 0, usageCount = 0;

  for (let i = 0; i < 12; i++) {
    const title = faker.lorem.sentence({ min: 4, max: 10 }).replace(/\.$/, '');
    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Date.now()}-${i}`;
    const author = random(users);
    const image = media.length ? random(media) : null;

    const article = await prisma.newsArticle.create({
      data: {
        title, slug,
        content: faker.lorem.paragraphs({ min: 3, max: 6 }, '\n\n'),
        excerpt: faker.lorem.sentences({ min: 1, max: 2 }),
        category: random(categories),
        published: true,
        publishedAt: faker.date.between({ from: '2025-01-01', to: new Date() }),
        feature: i < 3,
        authorId: author.id,
        image: image?.url ?? null,
      },
    });
    articleCount++;

    // FileUsage for the article image
    if (image) {
      try {
        await prisma.fileUsage.create({ data: { mediaId: image.id, entityType: 'NEWS_ARTICLE', entityId: article.id, fieldName: 'image' } });
        usageCount++;
      } catch { /* skip */ }
    }

    // Comments
    const numComments = randomInt(2, 6);
    for (let c = 0; c < numComments; c++) {
      try {
        await prisma.comment.create({
          data: {
            content: faker.lorem.sentence().slice(0, 190),
            authorName: faker.person.fullName(),
            authorEmail: faker.internet.email().toLowerCase(),
            approved: chance(0.8),
            articleId: article.id,
          },
        });
        commentCount++;
      } catch { /* skip */ }
    }
  }

  console.log(`    ${articleCount} articles, ${commentCount} comments, ${usageCount} file usages created.`);
}

// ---------------------------------------------------------------------------
// [15] PageContent
// ---------------------------------------------------------------------------

async function seedPageContent() {
  console.log('\n[15] Seeding page_contents...');

  const pages = [
    { slug: 'about', title: 'About ElevateBallers', metaTitle: 'About Us — ElevateBallers', metaDescription: 'Learn about the ElevateBallers basketball league.' },
    { slug: 'contact', title: 'Contact Us', metaTitle: 'Contact — ElevateBallers', metaDescription: 'Get in touch with ElevateBallers.' },
    { slug: 'rules', title: 'League Rules', metaTitle: 'Rules — ElevateBallers', metaDescription: 'Official league rules and regulations.' },
    { slug: 'privacy-policy', title: 'Privacy Policy', metaTitle: 'Privacy Policy — ElevateBallers', metaDescription: 'How we handle your data.' },
    { slug: 'faq', title: 'FAQ', metaTitle: 'FAQ — ElevateBallers', metaDescription: 'Frequently asked questions.' },
  ];

  let created = 0;
  for (const page of pages) {
    const existing = await prisma.pageContent.findUnique({ where: { slug: page.slug } });
    if (!existing) {
      await prisma.pageContent.create({ data: { ...page, content: faker.lorem.sentences(2).slice(0, 190), published: true } });
      created++;
    }
  }

  console.log(`    ${created} pages created.`);
}

// ---------------------------------------------------------------------------
// [16] SiteSettings
// ---------------------------------------------------------------------------

async function seedSiteSettings() {
  console.log('\n[16] Seeding site_settings...');

  const settings = [
    { key: 'site_name', value: 'ElevateBallers', type: 'text', label: 'Site Name', category: 'general' },
    { key: 'site_description', value: 'The premier basketball league management platform', type: 'text', label: 'Site Description', category: 'general' },
    { key: 'contact_email', value: 'ballers@elevateballers.com', type: 'email', label: 'Contact Email', category: 'contact' },
    { key: 'contact_phone', value: '0703913923', type: 'text', label: 'Contact Phone', category: 'contact' },
    { key: 'contact_fax', value: '0729259496', type: 'text', label: 'Contact Fax', category: 'contact' },
    { key: 'contact_address', value: 'Pepo Lane, off Dagoretti Road', type: 'text', label: 'Address', category: 'contact' },
    { key: 'contact_hours', value: 'Sat-Sun 8am - 6pm', type: 'text', label: 'Contact Hours', category: 'contact' },
    { key: 'social_facebook', value: 'https://www.facebook.com/Elevateballers', type: 'url', label: 'Facebook URL', category: 'social' },
    { key: 'social_instagram', value: 'https://www.instagram.com/elevateballers/', type: 'url', label: 'Instagram URL', category: 'social' },
    { key: 'social_twitter', value: 'https://twitter.com/elevateballers/', type: 'url', label: 'Twitter/X URL', category: 'social' },
    { key: 'social_youtube', value: 'https://www.youtube.com/@elevateballers9389/featured', type: 'url', label: 'YouTube URL', category: 'social' },
    { key: 'registration_open', value: 'true', type: 'boolean', label: 'Registration Open', category: 'registration' },
    { key: 'max_players_per_team', value: '15', type: 'number', label: 'Max Players Per Team', category: 'registration' },
    { key: 'season_year', value: String(new Date().getFullYear()), type: 'number', label: 'Current Season Year', category: 'general' },
  ];

  let created = 0;
  for (const s of settings) {
    const existing = await prisma.siteSetting.findUnique({ where: { key: s.key } });
    if (!existing) { await prisma.siteSetting.create({ data: s }); created++; }
  }

  console.log(`    ${created} settings created.`);
}

// ---------------------------------------------------------------------------
// [17] Sponsors
// ---------------------------------------------------------------------------

async function seedSponsors() {
  console.log('\n[17] Seeding sponsors...');

  const existing = await prisma.sponsor.count();
  if (existing >= 5) { console.log(`    ${existing} sponsors already exist — skipping.`); return; }

  const sponsors = [
    { name: 'SportsPro Equipment', image: 'https://picsum.photos/200/100?random=101', link: 'https://example.com/sportspro', order: 1, active: true },
    { name: 'FastBreak Energy', image: 'https://picsum.photos/200/100?random=102', link: 'https://example.com/fastbreak', order: 2, active: true },
    { name: 'Court Vision Apparel', image: 'https://picsum.photos/200/100?random=103', link: 'https://example.com/courtvision', order: 3, active: true },
    { name: 'Slam Dunk Insurance', image: 'https://picsum.photos/200/100?random=104', link: 'https://example.com/slamdunk', order: 4, active: true },
    { name: 'Triple Double Media', image: 'https://picsum.photos/200/100?random=105', link: 'https://example.com/tripledouble', order: 5, active: true },
    { name: 'Hoops Financial', image: 'https://picsum.photos/200/100?random=106', link: 'https://example.com/hoops', order: 6, active: false },
  ];

  for (const s of sponsors) await prisma.sponsor.create({ data: s });
  console.log(`    ${sponsors.length} sponsors created.`);
}

// ---------------------------------------------------------------------------
// [18] PlayerOfTheWeek
// ---------------------------------------------------------------------------

async function seedPlayerOfTheWeek(players) {
  console.log('\n[18] Seeding player_of_the_week...');

  const existing = await prisma.playerOfTheWeek.count();
  if (existing > 0) { console.log(`    ${existing} records already exist — skipping.`); return; }
  if (!players.length) { console.log('    No players — skipping.'); return; }

  const featured = faker.helpers.arrayElements(players, Math.min(3, players.length));
  for (let i = 0; i < featured.length; i++) {
    await prisma.playerOfTheWeek.create({ data: { playerId: featured[i].id, description: faker.lorem.paragraph(), active: i === 0 } });
  }

  console.log(`    ${featured.length} POTW records created.`);
}

// ---------------------------------------------------------------------------
// [19] ReportTemplates + ReportGenerations + EmailReports
// ---------------------------------------------------------------------------

async function seedReportTemplates() {
  console.log('\n[19] Seeding report_templates + report_generations + email_reports...');

  const existing = await prisma.reportTemplate.count();
  if (existing >= 8) { console.log(`    ${existing} templates already exist — skipping.`); return; }

  const reportTypes = ['GAME_STATISTICS', 'KEY_GAME_STATISTICS', 'PLAYER_STATISTICS', 'TEAM_STATISTICS', 'PLAY_BY_PLAY', 'SHOT_CHART', 'TURNOVER_TYPES', 'FOUL_TYPES'];
  let templates = 0, generations = 0, emails = 0;

  for (const reportType of reportTypes) {
    const name = reportType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const template = await prisma.reportTemplate.create({
      data: {
        name,
        description: `Default template for ${name.toLowerCase()} reports`,
        reportType,
        format: 'PDF',
        isDefault: true,
        template: { sections: ['header', 'summary', 'details', 'footer'], orientation: 'portrait', pageSize: 'A4' },
      },
    });
    templates++;

    const status = random(['COMPLETED', 'PENDING', 'FAILED']);
    const generation = await prisma.reportGeneration.create({
      data: {
        templateId: template.id,
        reportType,
        format: 'PDF',
        fileName: `${reportType.toLowerCase()}_${Date.now()}.pdf`,
        status,
        parameters: { year: new Date().getFullYear() },
        generatedBy: 'system',
      },
    });
    generations++;

    await prisma.emailReport.create({
      data: {
        reportGenerationId: generation.id,
        recipientEmail: faker.internet.email().toLowerCase(),
        recipientName: faker.person.fullName(),
        subject: `${name} Report`,
        status: status === 'COMPLETED' ? 'SENT' : 'PENDING',
        sentAt: status === 'COMPLETED' ? faker.date.recent() : null,
      },
    });
    emails++;
  }

  console.log(`    ${templates} templates, ${generations} generations, ${emails} email reports created.`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('Starting full database seed...\n');

  await seedPermissions();                              // permissions
  await seedRoles();                                    // roles, role_permissions
  const users = await seedUsers();                      // users, user_roles
  const gameRules = await seedGameRules();              // game_rules
  const teams = await seedTeams();                      // teams
  const players = await seedPlayers(teams);             // players, player_team_history, registration_notifications
  await seedStaff(teams);                               // staff, team_staff, registration_notifications
  const leagues = await seedLeagues();                  // leagues
  const seasons = await seedSeasons(leagues);           // seasons
  await seedMatches(teams, leagues, seasons, gameRules); // matches
  await seedMatchDetails(players);                      // match_players, match_periods, match_events, game_states,
                                                        // timeouts, substitutions, jump_balls, player_playing_time, event_history
  const folders = await seedFolders();                  // folders
  const media = await seedMedia(folders, users);        // media
  await seedNewsArticles(users, media);                 // news_articles, comments, file_usages
  await seedPageContent();                              // page_contents
  await seedSiteSettings();                             // site_settings
  await seedSponsors();                                 // sponsors
  await seedPlayerOfTheWeek(players);                   // player_of_the_week
  await seedReportTemplates();                          // report_templates, report_generations, email_reports

  console.log('\n✅ Full seed complete!');
  console.log(`\nAdmin login:`);
  console.log(`  Email:    ${process.env.ADMIN_EMAIL || 'admin@elevateballers.com'}`);
  console.log(`  Password: ${process.env.ADMIN_PASSWORD || 'admin123'}`);
}

main()
  .catch((error) => { console.error('Seed failed:', error); process.exit(1); })
  .finally(() => prisma.$disconnect());
