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

async function verify() {
  console.log('🔍 RBAC System Verification\n');
  console.log('='.repeat(60));

  try {
    // Count permissions
    const permissionCount = await prisma.permission.count();
    console.log('\n✓ Total Permissions:', permissionCount);

    // Count roles
    const roleCount = await prisma.role.count();
    const systemRoles = await prisma.role.count({ where: { isSystem: true } });
    console.log('✓ Total Roles:', roleCount, `(${systemRoles} system roles, ${roleCount - systemRoles} custom roles)`);

    // List all roles with details
    const roles = await prisma.role.findMany({
      select: {
        name: true,
        isSystem: true,
        description: true,
        _count: {
          select: {
            permissions: true,
            userRoles: true
          }
        }
      },
      orderBy: {
        isSystem: 'desc'
      }
    });

    console.log('\n' + '='.repeat(60));
    console.log('ROLES OVERVIEW');
    console.log('='.repeat(60));
    roles.forEach(role => {
      const badge = role.isSystem ? '[SYSTEM]' : '[CUSTOM]';
      console.log(`\n${badge} ${role.name}`);
      if (role.description) console.log(`  Description: ${role.description}`);
      console.log(`  Permissions: ${role._count.permissions}`);
      console.log(`  Users Assigned: ${role._count.userRoles}`);
    });

    // Count users
    const userCount = await prisma.user.count();
    const usersWithRoles = await prisma.user.count({
      where: { userRoles: { some: {} } }
    });
    const usersWithoutRoles = userCount - usersWithRoles;

    console.log('\n' + '='.repeat(60));
    console.log('USERS OVERVIEW');
    console.log('='.repeat(60));
    console.log(`Total Users: ${userCount}`);
    console.log(`Users with Roles: ${usersWithRoles}`);
    console.log(`Users without Roles: ${usersWithoutRoles}`);

    // Check permission categories
    const categories = await prisma.permission.groupBy({
      by: ['category'],
      _count: { id: true },
      orderBy: { category: 'asc' }
    });

    console.log('\n' + '='.repeat(60));
    console.log('PERMISSION CATEGORIES');
    console.log('='.repeat(60));
    categories.forEach(cat => {
      const categoryName = cat.category || 'Uncategorized';
      console.log(`  ${categoryName}: ${cat._count.id} permissions`);
    });

    // Verify critical permissions exist
    console.log('\n' + '='.repeat(60));
    console.log('CRITICAL PERMISSIONS CHECK');
    console.log('='.repeat(60));

    const criticalPermissions = [
      'teams:approve',
      'players:approve',
      'users:manage_roles',
      'roles:create',
      'roles:manage_permissions'
    ];

    for (const permName of criticalPermissions) {
      const [resource, action] = permName.split(':');
      const exists = await prisma.permission.findFirst({
        where: { resource, action }
      });
      console.log(`  ${permName}: ${exists ? '✓ EXISTS' : '✗ MISSING'}`);
    }

    // Check if Admin role has all permissions
    console.log('\n' + '='.repeat(60));
    console.log('ADMIN ROLE VERIFICATION');
    console.log('='.repeat(60));

    const adminRole = await prisma.role.findUnique({
      where: { name: 'Admin' },
      include: {
        _count: {
          select: { permissions: true }
        }
      }
    });

    if (adminRole) {
      console.log(`Admin role has ${adminRole._count.permissions} permissions`);
      console.log(`Total permissions: ${permissionCount}`);
      console.log(`Admin has all permissions: ${adminRole._count.permissions === permissionCount ? '✓ YES' : '✗ NO'}`);
    } else {
      console.log('✗ Admin role not found!');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ VERIFICATION COMPLETE');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
