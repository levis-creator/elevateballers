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

async function createAdminRole() {
  try {
    console.log('\n🔧 Creating Admin role...\n');

    // Check if Admin role exists
    let adminRole = await prisma.role.findUnique({
      where: { name: 'Admin' },
    });

    if (adminRole) {
      console.log('✅ Admin role already exists!\n');
      return;
    }

    // Create Admin role
    adminRole = await prisma.role.create({
      data: {
        name: 'Admin',
        description: 'Full system access with all permissions',
        isSystem: true,
      },
    });

    console.log('✅ Admin role created!\n');

    // Get all permissions
    const allPermissions = await prisma.permission.findMany();

    if (allPermissions.length === 0) {
      console.log('⚠️  No permissions found. Please run database seed first.\n');
      return;
    }

    // Assign all permissions to Admin
    console.log(`Assigning ${allPermissions.length} permissions to Admin role...`);

    for (const permission of allPermissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      });
    }

    console.log(`\n✅ Admin role created with ${allPermissions.length} permissions!\n`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAdminRole();
