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

async function syncAdminPermissions() {
  try {
    console.log('\n🔄 Syncing Admin Role Permissions...\n');

    // Get or create Admin role
    let adminRole = await prisma.role.findUnique({
      where: { name: 'Admin' },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!adminRole) {
      console.log('📝 Creating Admin role...');
      adminRole = await prisma.role.create({
        data: {
          name: 'Admin',
          description: 'Full system access with all permissions',
          isSystem: true,
        },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });
      console.log('✅ Admin role created!\n');
    } else {
      console.log('✅ Admin role found\n');
    }

    // Get all permissions
    const allPermissions = await prisma.permission.findMany({
      orderBy: [
        { category: 'asc' },
        { resource: 'asc' },
        { action: 'asc' },
      ],
    });

    console.log(`📋 Total Permissions in System: ${allPermissions.length}\n`);

    // Get currently assigned permission IDs
    const assignedPermissionIds = new Set(
      adminRole.permissions.map(rp => rp.permission.id)
    );

    console.log(`✓  Currently Assigned: ${assignedPermissionIds.size}`);

    // Find missing permissions
    const missingPermissions = allPermissions.filter(
      p => !assignedPermissionIds.has(p.id)
    );

    if (missingPermissions.length === 0) {
      console.log('✅ Admin already has all permissions!\n');

      // Show summary
      console.log('📊 Permission Summary by Category:');
      const byCategory = {};
      allPermissions.forEach(p => {
        const cat = p.category || 'Uncategorized';
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(p);
      });

      Object.entries(byCategory).forEach(([category, perms]) => {
        console.log(`   ${category}: ${perms.length} permissions`);
      });

      console.log('');
      return;
    }

    console.log(`⚠️  Missing: ${missingPermissions.length}\n`);

    console.log('🔧 Adding missing permissions:\n');

    // Group by category
    const byCategory = {};
    missingPermissions.forEach(p => {
      const cat = p.category || 'Uncategorized';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(p);
    });

    // Assign missing permissions to Admin
    for (const permission of missingPermissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      });
      console.log(`   ✓ ${permission.resource}:${permission.action}`);
    }

    console.log(`\n✅ Added ${missingPermissions.length} permissions to Admin role\n`);

    // Verify
    const updatedAdmin = await prisma.role.findUnique({
      where: { name: 'Admin' },
      include: {
        _count: {
          select: { permissions: true },
        },
      },
    });

    console.log('📊 Final Summary:');
    console.log(`   Total Permissions: ${allPermissions.length}`);
    console.log(`   Admin Permissions: ${updatedAdmin._count.permissions}`);
    console.log(`   Coverage: 100%\n`);

    // Show summary by category
    console.log('📋 Permissions by Category:');
    const finalByCategory = {};
    allPermissions.forEach(p => {
      const cat = p.category || 'Uncategorized';
      if (!finalByCategory[cat]) finalByCategory[cat] = [];
      finalByCategory[cat].push(p);
    });

    Object.entries(finalByCategory).forEach(([category, perms]) => {
      console.log(`   ${category}: ${perms.length} permissions`);
    });

    console.log('\n✅ Admin role now has ALL permissions!\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

syncAdminPermissions();
