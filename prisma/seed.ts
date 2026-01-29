import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

// Load environment variables
config();

/**
 * Hash a password using bcrypt
 */
async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

/**
 * Create Prisma client with MariaDB adapter
 */
function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL environment variable is not set. ' +
      'Please configure it in your .env file or environment variables.'
    );
  }

  // Parse MySQL connection string
  let poolConfig: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    connectionLimit?: number;
    idleTimeout?: number;
    connectTimeout?: number;
  };

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

/**
 * Seed admin user
 */
async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@elevateballers.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const name = process.env.ADMIN_NAME || 'Admin User';

  console.log('\n🌱 Seeding admin user...');
  console.log(`Email: ${email}`);
  console.log(`Name: ${name}`);

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email },
  });

  if (existingAdmin) {
    console.log(`⚠️  Admin user with email "${email}" already exists.`);
    
    // Update password if provided via env var (useful for resetting password)
    if (process.env.ADMIN_PASSWORD) {
      const hashedPassword = await hashPassword(password);
      await prisma.user.update({
        where: { email },
        data: {
          passwordHash: hashedPassword,
          name,
          role: 'ADMIN',
        },
      });
      console.log('✅ Admin user password updated!');
    } else {
      console.log('ℹ️  Skipping creation. Set ADMIN_PASSWORD env var to update password.');
    }
    
    return existingAdmin;
  }

  // Create new admin user
  const hashedPassword = await hashPassword(password);
  
  const admin = await prisma.user.create({
    data: {
      email,
      passwordHash: hashedPassword,
      name,
      role: 'ADMIN',
    },
  });

  console.log('✅ Admin user created successfully!');
  console.log(`   User ID: ${admin.id}`);
  console.log(`   Email: ${admin.email}`);
  console.log(`   Role: ${admin.role}`);
  
  return admin;
}

/**
 * Main seed function
 */
async function main() {
  console.log('🚀 Starting database seeding...\n');

  try {
    // Seed admin user
    await seedAdmin();

    console.log('\n✅ Seeding completed successfully!');
    console.log('\n📝 Login credentials:');
    console.log(`   Email: ${process.env.ADMIN_EMAIL || 'admin@elevateballers.com'}`);
    console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'admin123'}`);
    console.log('\n⚠️  Remember to change the default password after first login!');
  } catch (error) {
    console.error('\n❌ Error during seeding:', error);
    throw error;
  }
}

// Run seed
main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
