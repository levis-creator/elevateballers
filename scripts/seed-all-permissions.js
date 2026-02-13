import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { config } from 'dotenv';

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

// Comprehensive permission definitions
const PERMISSIONS = [
  // Users
  { resource: 'users', action: 'create', description: 'Create new users', category: 'Users' },
  { resource: 'users', action: 'read', description: 'View users', category: 'Users' },
  { resource: 'users', action: 'update', description: 'Edit user details', category: 'Users' },
  { resource: 'users', action: 'delete', description: 'Delete users', category: 'Users' },
  { resource: 'users', action: 'manage_roles', description: 'Assign roles to users', category: 'Users' },

  // Roles
  { resource: 'roles', action: 'create', description: 'Create new roles', category: 'Roles & Permissions' },
  { resource: 'roles', action: 'read', description: 'View roles', category: 'Roles & Permissions' },
  { resource: 'roles', action: 'update', description: 'Edit roles', category: 'Roles & Permissions' },
  { resource: 'roles', action: 'delete', description: 'Delete roles', category: 'Roles & Permissions' },
  { resource: 'roles', action: 'manage_permissions', description: 'Assign permissions to roles', category: 'Roles & Permissions' },

  // Permissions
  { resource: 'permissions', action: 'read', description: 'View permissions', category: 'Roles & Permissions' },
  { resource: 'permissions', action: 'manage', description: 'Manage permissions', category: 'Roles & Permissions' },

  // Teams
  { resource: 'teams', action: 'create', description: 'Create teams', category: 'Teams' },
  { resource: 'teams', action: 'read', description: 'View teams', category: 'Teams' },
  { resource: 'teams', action: 'update', description: 'Edit teams', category: 'Teams' },
  { resource: 'teams', action: 'delete', description: 'Delete teams', category: 'Teams' },
  { resource: 'teams', action: 'approve', description: 'Approve team registrations', category: 'Teams' },
  { resource: 'teams', action: 'bulk_delete', description: 'Bulk delete teams', category: 'Teams' },
  { resource: 'teams', action: 'bulk_approve', description: 'Bulk approve teams', category: 'Teams' },
  { resource: 'teams', action: 'manage_staff', description: 'Manage team staff', category: 'Teams' },

  // Players
  { resource: 'players', action: 'create', description: 'Create players', category: 'Players' },
  { resource: 'players', action: 'read', description: 'View players', category: 'Players' },
  { resource: 'players', action: 'update', description: 'Edit players', category: 'Players' },
  { resource: 'players', action: 'delete', description: 'Delete players', category: 'Players' },
  { resource: 'players', action: 'approve', description: 'Approve player registrations', category: 'Players' },
  { resource: 'players', action: 'bulk_delete', description: 'Bulk delete players', category: 'Players' },
  { resource: 'players', action: 'bulk_approve', description: 'Bulk approve players', category: 'Players' },
  { resource: 'players', action: 'view_stats', description: 'View player statistics', category: 'Players' },

  // Matches
  { resource: 'matches', action: 'create', description: 'Create matches', category: 'Matches' },
  { resource: 'matches', action: 'read', description: 'View matches', category: 'Matches' },
  { resource: 'matches', action: 'update', description: 'Edit matches', category: 'Matches' },
  { resource: 'matches', action: 'delete', description: 'Delete matches', category: 'Matches' },
  { resource: 'matches', action: 'track', description: 'Track live game events', category: 'Matches' },
  { resource: 'matches', action: 'manage_events', description: 'Manage match events', category: 'Matches' },
  { resource: 'matches', action: 'manage_players', description: 'Manage match players', category: 'Matches' },
  { resource: 'matches', action: 'bulk_delete', description: 'Bulk delete matches', category: 'Matches' },
  { resource: 'matches', action: 'view_reports', description: 'View match reports', category: 'Matches' },

  // Media
  { resource: 'media', action: 'create', description: 'Upload media', category: 'Media' },
  { resource: 'media', action: 'read', description: 'View media', category: 'Media' },
  { resource: 'media', action: 'update', description: 'Edit media', category: 'Media' },
  { resource: 'media', action: 'delete', description: 'Delete media', category: 'Media' },
  { resource: 'media', action: 'view_private', description: 'View private media', category: 'Media' },
  { resource: 'media', action: 'batch_upload', description: 'Batch upload media', category: 'Media' },
  { resource: 'media', action: 'batch_move', description: 'Batch move media', category: 'Media' },
  { resource: 'media', action: 'export', description: 'Export media as ZIP', category: 'Media' },
  { resource: 'media', action: 'cleanup', description: 'Run cleanup operations', category: 'Media' },

  // Folders
  { resource: 'folders', action: 'create', description: 'Create folders', category: 'Media' },
  { resource: 'folders', action: 'read', description: 'View folders', category: 'Media' },
  { resource: 'folders', action: 'update', description: 'Edit folders', category: 'Media' },
  { resource: 'folders', action: 'delete', description: 'Delete folders', category: 'Media' },

  // News Articles
  { resource: 'news_articles', action: 'create', description: 'Create news articles', category: 'News' },
  { resource: 'news_articles', action: 'read', description: 'View news articles', category: 'News' },
  { resource: 'news_articles', action: 'update', description: 'Edit news articles', category: 'News' },
  { resource: 'news_articles', action: 'delete', description: 'Delete news articles', category: 'News' },
  { resource: 'news_articles', action: 'publish', description: 'Publish/unpublish articles', category: 'News' },
  { resource: 'news_articles', action: 'bulk_delete', description: 'Bulk delete articles', category: 'News' },

  // Comments
  { resource: 'comments', action: 'create', description: 'Create comments', category: 'News' },
  { resource: 'comments', action: 'read', description: 'View comments', category: 'News' },
  { resource: 'comments', action: 'update', description: 'Edit comments', category: 'News' },
  { resource: 'comments', action: 'delete', description: 'Delete comments', category: 'News' },

  // Staff
  { resource: 'staff', action: 'create', description: 'Create staff', category: 'Staff' },
  { resource: 'staff', action: 'read', description: 'View staff', category: 'Staff' },
  { resource: 'staff', action: 'update', description: 'Edit staff', category: 'Staff' },
  { resource: 'staff', action: 'delete', description: 'Delete staff', category: 'Staff' },
  { resource: 'staff', action: 'bulk_delete', description: 'Bulk delete staff', category: 'Staff' },

  // Leagues
  { resource: 'leagues', action: 'create', description: 'Create leagues', category: 'Leagues & Seasons' },
  { resource: 'leagues', action: 'read', description: 'View leagues', category: 'Leagues & Seasons' },
  { resource: 'leagues', action: 'update', description: 'Edit leagues', category: 'Leagues & Seasons' },
  { resource: 'leagues', action: 'delete', description: 'Delete leagues', category: 'Leagues & Seasons' },
  { resource: 'leagues', action: 'bulk_delete', description: 'Bulk delete leagues', category: 'Leagues & Seasons' },

  // Seasons
  { resource: 'seasons', action: 'create', description: 'Create seasons', category: 'Leagues & Seasons' },
  { resource: 'seasons', action: 'read', description: 'View seasons', category: 'Leagues & Seasons' },
  { resource: 'seasons', action: 'update', description: 'Edit seasons', category: 'Leagues & Seasons' },
  { resource: 'seasons', action: 'delete', description: 'Delete seasons', category: 'Leagues & Seasons' },
  { resource: 'seasons', action: 'bulk_delete', description: 'Bulk delete seasons', category: 'Leagues & Seasons' },

  // Pages
  { resource: 'page_contents', action: 'create', description: 'Create pages', category: 'Content' },
  { resource: 'page_contents', action: 'read', description: 'View pages', category: 'Content' },
  { resource: 'page_contents', action: 'update', description: 'Edit pages', category: 'Content' },
  { resource: 'page_contents', action: 'delete', description: 'Delete pages', category: 'Content' },
  { resource: 'page_contents', action: 'bulk_delete', description: 'Bulk delete pages', category: 'Content' },

  // Settings
  { resource: 'site_settings', action: 'read', description: 'View settings', category: 'Settings' },
  { resource: 'site_settings', action: 'manage', description: 'Full settings management', category: 'Settings' },

  // Player of the Week
  { resource: 'potw', action: 'create', description: 'Create POTW entries', category: 'Player of the Week' },
  { resource: 'potw', action: 'read', description: 'View POTW entries', category: 'Player of the Week' },
  { resource: 'potw', action: 'update', description: 'Edit POTW entries', category: 'Player of the Week' },
  { resource: 'potw', action: 'delete', description: 'Delete POTW entries', category: 'Player of the Week' },

  // Sponsors
  { resource: 'sponsors', action: 'create', description: 'Create sponsors', category: 'Sponsors' },
  { resource: 'sponsors', action: 'read', description: 'View sponsors', category: 'Sponsors' },
  { resource: 'sponsors', action: 'update', description: 'Edit sponsors', category: 'Sponsors' },
  { resource: 'sponsors', action: 'delete', description: 'Delete sponsors', category: 'Sponsors' },

  // Tournaments
  { resource: 'tournaments', action: 'create', description: 'Create tournaments', category: 'Tournaments' },
  { resource: 'tournaments', action: 'read', description: 'View tournaments', category: 'Tournaments' },
  { resource: 'tournaments', action: 'update', description: 'Edit tournaments', category: 'Tournaments' },
  { resource: 'tournaments', action: 'delete', description: 'Delete tournaments', category: 'Tournaments' },
  { resource: 'tournaments', action: 'generate_bracket', description: 'Generate tournament brackets', category: 'Tournaments' },

  // Reports
  { resource: 'reports', action: 'read', description: 'View reports', category: 'Reports' },
  { resource: 'reports', action: 'generate', description: 'Generate reports', category: 'Reports' },
  { resource: 'reports', action: 'download', description: 'Download reports', category: 'Reports' },
  { resource: 'reports', action: 'email', description: 'Email reports', category: 'Reports' },

  // Notifications
  { resource: 'notifications', action: 'read', description: 'View notifications', category: 'Notifications' },
  { resource: 'notifications', action: 'manage', description: 'Manage notifications', category: 'Notifications' },

  // Game Rules
  { resource: 'game_rules', action: 'read', description: 'View game rules', category: 'Game Rules' },
  { resource: 'game_rules', action: 'manage', description: 'Manage game rules', category: 'Game Rules' },
];

async function seedPermissions() {
  try {
    console.log('\n🌱 Seeding All Permissions...\n');
    console.log(`📋 Seeding ${PERMISSIONS.length} permissions...\n`);

    let added = 0;
    let existing = 0;

    for (const perm of PERMISSIONS) {
      const existingPerm = await prisma.permission.findUnique({
        where: {
          resource_action: {
            resource: perm.resource,
            action: perm.action,
          },
        },
      });

      if (!existingPerm) {
        await prisma.permission.create({
          data: perm,
        });
        added++;
        console.log(`   ✓ ${perm.resource}:${perm.action}`);
      } else {
        existing++;
      }
    }

    console.log(`\n✅ Seeding Complete!`);
    console.log(`   Added: ${added} new permissions`);
    console.log(`   Existing: ${existing} permissions`);
    console.log(`   Total: ${PERMISSIONS.length} permissions\n`);

    // Summary by category
    const byCategory = {};
    PERMISSIONS.forEach(p => {
      if (!byCategory[p.category]) byCategory[p.category] = 0;
      byCategory[p.category]++;
    });

    console.log('📊 Permissions by Category:');
    Object.entries(byCategory)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([category, count]) => {
        console.log(`   ${category}: ${count} permissions`);
      });

    console.log('\n💡 Next Steps:');
    console.log('   1. Run: node scripts/sync-admin-permissions.js');
    console.log('   2. Verify: node scripts/verify-admin-user.js\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedPermissions();
