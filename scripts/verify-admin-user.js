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

async function verifyAdminUser() {
  try {
    console.log('\n🔍 Verifying Admin User Setup...\n');

    // Find admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@elevateballers.com' },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!adminUser) {
      console.log('❌ Admin user not found!\n');
      console.log('Run: node scripts/create-admin.js\n');
      return;
    }

    console.log('✅ Admin User Found:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Name: ${adminUser.name}`);
    console.log(`   ID: ${adminUser.id}\n`);

    // Check roles
    console.log('📋 Roles:');
    if (adminUser.userRoles.length === 0) {
      console.log('   ❌ No roles assigned!\n');
      console.log('   Assigning Admin role...\n');

      // Find Admin role
      const adminRole = await prisma.role.findUnique({
        where: { name: 'Admin' },
      });

      if (!adminRole) {
        console.log('   ❌ Admin role not found! Run: node scripts/create-admin-role.js\n');
        return;
      }

      // Assign Admin role
      await prisma.userRole.create({
        data: {
          userId: adminUser.id,
          roleId: adminRole.id,
        },
      });

      console.log('   ✅ Admin role assigned!\n');

      // Re-fetch user
      const updatedUser = await prisma.user.findUnique({
        where: { id: adminUser.id },
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      console.log('✅ Updated Roles:');
      updatedUser.userRoles.forEach(ur => {
        console.log(`   • ${ur.role.name} (${ur.role.permissions.length} permissions)`);
      });

      // Show permissions
      const permissions = new Set();
      updatedUser.userRoles.forEach(ur => {
        ur.role.permissions.forEach(rp => {
          permissions.add(`${rp.permission.resource}:${rp.permission.action}`);
        });
      });

      console.log(`\n📝 Total Permissions: ${permissions.size}`);
      console.log('\n✅ Admin user is now ready!\n');

    } else {
      adminUser.userRoles.forEach(ur => {
        console.log(`   ✅ ${ur.role.name} (${ur.role.permissions.length} permissions)`);
      });

      // Show all permissions
      const permissions = new Set();
      adminUser.userRoles.forEach(ur => {
        ur.role.permissions.forEach(rp => {
          permissions.add(`${rp.permission.resource}:${rp.permission.action}`);
        });
      });

      console.log(`\n📝 Total Permissions: ${permissions.size}`);

      // Sample permissions
      console.log('\n📋 Sample Permissions:');
      Array.from(permissions).slice(0, 10).forEach(perm => {
        console.log(`   • ${perm}`);
      });
      if (permissions.size > 10) {
        console.log(`   ... and ${permissions.size - 10} more\n`);
      }

      console.log('\n✅ Admin user has proper RBAC setup!\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verifyAdminUser();
