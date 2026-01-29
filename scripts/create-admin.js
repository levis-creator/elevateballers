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

  console.log('🚀 Creating admin user...');
  console.log(`Email: ${email}`);
  console.log(`Name: ${name}`);

  const hashedPassword = await hashPassword(password);

  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        passwordHash: hashedPassword,
        name,
        role: 'ADMIN',
      },
      create: {
        email,
        passwordHash: hashedPassword,
        name,
        role: 'ADMIN',
      },
    });

    console.log('\n✅ Admin user created/updated successfully!');
    console.log(`   User ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log('\n📝 Login credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n⚠️  Remember to change the default password after first login!');
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
