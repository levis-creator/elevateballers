import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

config();

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set.');
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

const prisma = createPrismaClient();

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

async function seedRoles() {
  console.log('\n[2] Seeding roles + role_permissions...');
  const allPermissions = await prisma.permission.findMany({ select: { id: true, resource: true, action: true } });
  const permissionMap = new Map(allPermissions.map((p) => [`${p.resource}:${p.action}`, p.id]));

  for (const roleDef of ROLE_DEFINITIONS) {
    let role = await prisma.role.findUnique({ where: { name: roleDef.name } });
    if (!role) {
      role = await prisma.role.create({ data: { name: roleDef.name, description: roleDef.description, isSystem: roleDef.isSystem } });
    }

    const targetIds = roleDef.permissions === null
      ? allPermissions.map((p) => p.id)
      : roleDef.permissions.map((k) => permissionMap.get(k)).filter(Boolean);

    const existing = await prisma.rolePermission.findMany({ where: { roleId: role.id }, select: { permissionId: true } });
    const assignedIds = new Set(existing.map((rp) => rp.permissionId));
    const toAdd = targetIds.filter((id) => !assignedIds.has(id));
    if (toAdd.length > 0) {
      await prisma.rolePermission.createMany({
        data: toAdd.map((permissionId) => ({ roleId: role.id, permissionId })),
        skipDuplicates: true,
      });
      console.log(`    [${roleDef.name}] assigned ${toAdd.length} new permission(s).`);
    } else {
      console.log(`    [${roleDef.name}] up to date.`);
    }
  }

  const total = await prisma.role.count();
  console.log(`    Total: ${total} roles.`);
}

async function main() {
  console.log('Seeding permissions and roles only...');
  await seedPermissions();
  await seedRoles();
  console.log('\nDone.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
