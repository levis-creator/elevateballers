import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

config();

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL not set');
  }

  const url = new URL(connectionString);
  const poolConfig = {
    host: url.hostname,
    port: parseInt(url.port) || 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    connectionLimit: 5,
  };

  const adapter = new PrismaMariaDb(poolConfig);
  return new PrismaClient({ adapter, log: ['error', 'warn'] });
}

const prisma = createPrismaClient();

const CSV_PERMISSIONS_PATH = process.env.PERMISSIONS_CSV
  ? path.resolve(process.env.PERMISSIONS_CSV)
  : path.resolve(process.cwd(), 'scripts/data/permissions.csv');

// Legacy/fallback permission category mapping
const PERMISSION_CATEGORIES = {
  teams: 'Teams',
  players: 'Players',
  matches: 'Matches',
  media: 'Media',
  news_articles: 'News',
  users: 'Users',
  roles: 'Roles & Permissions',
  leagues: 'Leagues & Seasons',
  seasons: 'Leagues & Seasons',
  site_settings: 'Settings',
  staff: 'Staff',
  reports: 'Reports',
  registration_notifications: 'Notifications',
  game_rules: 'Game Rules',
  folders: 'Media',
  comments: 'News',
  page_contents: 'Content',
  potw: 'Player of the Week',
  sponsors: 'Sponsors',
  tournaments: 'Tournaments',
};

// Additional permissions to add (legacy fallback when CSV is unavailable)
const ADDITIONAL_PERMISSIONS = [
  // Teams
  { resource: 'teams', action: 'approve', description: 'Approve team registrations', category: 'Teams' },
  { resource: 'teams', action: 'bulk_delete', description: 'Bulk delete teams', category: 'Teams' },
  { resource: 'teams', action: 'bulk_approve', description: 'Bulk approve teams', category: 'Teams' },
  { resource: 'teams', action: 'manage_staff', description: 'Manage team staff', category: 'Teams' },

  // Players
  { resource: 'players', action: 'approve', description: 'Approve player registrations', category: 'Players' },
  { resource: 'players', action: 'bulk_delete', description: 'Bulk delete players', category: 'Players' },
  { resource: 'players', action: 'bulk_approve', description: 'Bulk approve players', category: 'Players' },
  { resource: 'players', action: 'view_stats', description: 'View player statistics', category: 'Players' },

  // Matches
  { resource: 'matches', action: 'track', description: 'Track live game events', category: 'Matches' },
  { resource: 'matches', action: 'manage_events', description: 'Manage match events', category: 'Matches' },
  { resource: 'matches', action: 'manage_players', description: 'Manage match players', category: 'Matches' },
  { resource: 'matches', action: 'bulk_delete', description: 'Bulk delete matches', category: 'Matches' },
  { resource: 'matches', action: 'view_reports', description: 'View match reports', category: 'Matches' },

  // Media
  { resource: 'media', action: 'view_private', description: 'View private media', category: 'Media' },
  { resource: 'media', action: 'batch_upload', description: 'Batch upload media', category: 'Media' },
  { resource: 'media', action: 'batch_move', description: 'Batch move media', category: 'Media' },
  { resource: 'media', action: 'export', description: 'Export media as ZIP', category: 'Media' },
  { resource: 'media', action: 'cleanup', description: 'Run cleanup operations', category: 'Media' },

  // News
  { resource: 'news_articles', action: 'publish', description: 'Publish/unpublish articles', category: 'News' },
  { resource: 'news_articles', action: 'bulk_delete', description: 'Bulk delete articles', category: 'News' },

  // Users & Roles
  { resource: 'users', action: 'manage_roles', description: 'Assign roles to users', category: 'Users' },
  { resource: 'roles', action: 'manage_permissions', description: 'Assign permissions to roles', category: 'Roles & Permissions' },

  // Staff
  { resource: 'staff', action: 'bulk_delete', description: 'Bulk delete staff', category: 'Staff' },

  // Reports
  { resource: 'reports', action: 'generate', description: 'Generate reports', category: 'Reports' },
  { resource: 'reports', action: 'download', description: 'Download reports', category: 'Reports' },
  { resource: 'reports', action: 'email', description: 'Email reports', category: 'Reports' },

  // Settings
  { resource: 'site_settings', action: 'manage', description: 'Full settings management', category: 'Settings' },

  // Notifications
  { resource: 'registration_notifications', action: 'manage', description: 'Manage notifications', category: 'Notifications' },
];

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
  return values.map((value) => value.trim());
}

function loadPermissionsFromCsv() {
  if (!fs.existsSync(CSV_PERMISSIONS_PATH)) {
    return null;
  }

  const raw = fs.readFileSync(CSV_PERMISSIONS_PATH, 'utf8');
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return null;

  const headers = parseCsvLine(lines[0]);
  const idx = (name) => headers.indexOf(name);

  const resourceIdx = idx('resource');
  const actionIdx = idx('action');
  const descriptionIdx = idx('description');
  const categoryIdx = idx('category');

  if (resourceIdx === -1 || actionIdx === -1) {
    return null;
  }

  const permissions = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const resource = values[resourceIdx];
    const action = values[actionIdx];
    if (!resource || !action) continue;

    permissions.push({
      resource,
      action,
      description: values[descriptionIdx] || null,
      category: values[categoryIdx] || null,
    });
  }

  return permissions;
}

async function enhanceRBAC() {
  console.log('\n🔧 Enhancing RBAC system...\n');

  try {
    const csvPermissions = loadPermissionsFromCsv();

    if (csvPermissions && csvPermissions.length > 0) {
      console.log(`1️⃣  Seeding permissions from CSV (${CSV_PERMISSIONS_PATH})...`);
      let addedCount = 0;
      let updatedCount = 0;

      for (const perm of csvPermissions) {
        const existing = await prisma.permission.findUnique({
          where: {
            resource_action: {
              resource: perm.resource,
              action: perm.action,
            },
          },
        });

        if (!existing) {
          await prisma.permission.create({ data: perm });
          addedCount++;
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
            updatedCount++;
          }
        }
      }

      console.log(`   ✅ Added ${addedCount} permissions`);
      console.log(`   ✅ Updated ${updatedCount} permissions\n`);
    } else {
      // 1. Update existing permissions with categories
      console.log('1️⃣  Adding categories to existing permissions...');
      const existingPermissions = await prisma.permission.findMany();

      let updatedCount = 0;
      for (const perm of existingPermissions) {
        const category = PERMISSION_CATEGORIES[perm.resource];
        if (category && !perm.category) {
          await prisma.permission.update({
            where: { id: perm.id },
            data: { category },
          });
          updatedCount++;
        }
      }
      console.log(`   ✅ Updated ${updatedCount} permissions with categories\n`);

      // 2. Add additional permissions
      console.log('2️⃣  Adding new permissions...');
      let addedCount = 0;

      for (const perm of ADDITIONAL_PERMISSIONS) {
        const existing = await prisma.permission.findUnique({
          where: {
            resource_action: {
              resource: perm.resource,
              action: perm.action,
            },
          },
        });

        if (!existing) {
          await prisma.permission.create({
            data: perm,
          });
          addedCount++;
          console.log(`   ➕ Added: ${perm.resource}:${perm.action}`);
        }
      }
      console.log(`   ✅ Added ${addedCount} new permissions\n`);
    }

    // 3. Mark existing roles as system roles
    console.log('3️⃣  Marking existing roles as system roles...');
    const systemRoleNames = ['Admin', 'Editor', 'Statistician'];

    for (const roleName of systemRoleNames) {
      await prisma.role.updateMany({
        where: { name: roleName },
        data: { isSystem: true },
      });
    }
    console.log(`   ✅ Marked ${systemRoleNames.length} roles as system roles\n`);

    // 4. Create additional default roles
    console.log('4️⃣  Creating additional default roles...');

    const additionalRoles = [
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

    for (const roleData of additionalRoles) {
      const existing = await prisma.role.findUnique({
        where: { name: roleData.name },
      });

      if (!existing) {
        // Create role
        const role = await prisma.role.create({
          data: {
            name: roleData.name,
            description: roleData.description,
            isSystem: roleData.isSystem,
          },
        });

        // Assign permissions
        for (const permName of roleData.permissions) {
          const [resource, action] = permName.split(':');
          const permission = await prisma.permission.findUnique({
            where: {
              resource_action: { resource, action },
            },
          });

          if (permission) {
            await prisma.rolePermission.create({
              data: {
                roleId: role.id,
                permissionId: permission.id,
              },
            });
          }
        }

        console.log(`   ➕ Created role: ${roleData.name} with ${roleData.permissions.length} permissions`);
      } else {
        console.log(`   ⏭️  Role already exists: ${roleData.name}`);
      }
    }

    // 5. Summary
    console.log('\n📊 Summary:');
    const totalPermissions = await prisma.permission.count();
    const totalRoles = await prisma.role.count();
    const roles = await prisma.role.findMany({
      include: {
        _count: {
          select: { permissions: true },
        },
      },
    });

    console.log(`   Total permissions: ${totalPermissions}`);
    console.log(`   Total roles: ${totalRoles}\n`);

    console.log('   Roles:');
    roles.forEach(r => {
      console.log(`     - ${r.name}: ${r._count.permissions} permissions ${r.isSystem ? '(System)' : ''}`);
    });

    console.log('\n✅ RBAC enhancement complete!\n');
  } catch (error) {
    console.error('❌ Error enhancing RBAC:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

enhanceRBAC();
