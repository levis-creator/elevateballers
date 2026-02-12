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

async function updateAdminPermissions() {
  try {
    console.log('\n🔧 Updating Admin role with all permissions...\n');

    // Get Admin role
    const adminRole = await prisma.role.findUnique({
      where: { name: 'Admin' },
      include: {
        permissions: true,
      },
    });

    if (!adminRole) {
      console.log('❌ Admin role not found');
      return;
    }

    // Get all permissions
    const allPermissions = await prisma.permission.findMany();

    // Get currently assigned permission IDs
    const assignedPermissionIds = new Set(
      adminRole.permissions.map(rp => rp.permissionId)
    );

    // Find missing permissions
    const missingPermissions = allPermissions.filter(
      p => !assignedPermissionIds.has(p.id)
    );

    if (missingPermissions.length === 0) {
      console.log('✅ Admin already has all permissions!\n');
      return;
    }

    console.log(`   Found ${missingPermissions.length} missing permissions:`);
    missingPermissions.forEach(p => {
      console.log(`     - ${p.resource}:${p.action}`);
    });

    // Assign missing permissions to Admin
    for (const permission of missingPermissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      });
    }

    console.log(`\n   ✅ Added ${missingPermissions.length} permissions to Admin role\n`);

    // Verify
    const updatedAdmin = await prisma.role.findUnique({
      where: { name: 'Admin' },
      include: {
        _count: {
          select: { permissions: true },
        },
      },
    });

    console.log(`   Admin now has ${updatedAdmin._count.permissions}/${allPermissions.length} permissions\n`);
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminPermissions();
