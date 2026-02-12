import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

// Load environment variables
config();

/**
 * Hash a password using bcrypt
 */
async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

/**
 * Create Prisma client with MariaDB adapter
 * This ensures it works in both local and cPanel environments
 */
function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL environment variable is not set. ' +
      'Please configure it in your .env file or environment variables.'
    );
  }

  // Parse MySQL connection string
  let poolConfig;

  try {
    const url = new URL(connectionString);
    
    poolConfig = {
      host: url.hostname,
      port: parseInt(url.port) || 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.slice(1), // Remove leading '/'
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

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@elevateballers.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const name = process.env.ADMIN_NAME || 'Admin User';

  console.log('🚀 Creating admin user with RBAC...');
  console.log(`Email: ${email}`);
  console.log(`Name: ${name}\n`);

  try {
    // Check if Admin role exists
    const adminRole = await prisma.role.findUnique({
      where: { name: 'Admin' },
      include: {
        _count: {
          select: { permissions: true }
        }
      }
    });

    if (!adminRole) {
      console.error('❌ Admin role not found in database!');
      console.error('\nPlease run the seed scripts first:');
      console.error('  1. node scripts/enhance-rbac.js');
      console.error('  2. node scripts/update-admin-permissions.js\n');
      process.exit(1);
    }

    console.log(`✓ Admin role found (${adminRole._count.permissions} permissions)\n`);

    const hashedPassword = await hashPassword(password);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    let user;

    if (existingUser) {
      console.log('⚠️  User already exists, updating...');

      // Update user
      user = await prisma.user.update({
        where: { email },
        data: {
          passwordHash: hashedPassword,
          name,
        },
      });

      // Check if user already has Admin role
      const hasAdminRole = existingUser.userRoles.some(
        ur => ur.role.name === 'Admin'
      );

      if (!hasAdminRole) {
        console.log('✓ Assigning Admin role...');
        await prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: adminRole.id,
          },
        });
      } else {
        console.log('✓ User already has Admin role');
      }
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          name,
          emailVerified: new Date(), // Auto-verify admin
        },
      });

      console.log('✓ User created');

      // Assign Admin role
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: adminRole.id,
        },
      });

      console.log('✓ Admin role assigned');
    }

    // Fetch final user with roles and permissions
    const finalUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                _count: {
                  select: { permissions: true }
                }
              }
            }
          }
        }
      }
    });

    const totalPermissions = finalUser.userRoles.reduce(
      (sum, ur) => sum + ur.role._count.permissions,
      0
    );

    console.log('\n' + '='.repeat(60));
    console.log('✅ Admin user created/updated successfully!');
    console.log('='.repeat(60));
    console.log(`\nUser ID: ${user.id}`);
    console.log(`Email: ${user.email}`);
    console.log(`Name: ${user.name}`);
    console.log(`Roles: ${finalUser.userRoles.map(ur => ur.role.name).join(', ')}`);
    console.log(`Total Permissions: ${totalPermissions}`);
    console.log('\n📝 Login credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n⚠️  Remember to change the default password after first login!');
    console.log('\nYou can now login at: /admin/login\n');
  } catch (error) {
    console.error('\n❌ Error creating admin user:', error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
