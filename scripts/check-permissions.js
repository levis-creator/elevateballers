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
  return new PrismaClient({ adapter, log: ['error'] });
}

const prisma = createPrismaClient();

async function checkPermissions() {
  try {
    const count = await prisma.permission.count();
    console.log(`Total permissions: ${count}`);

    const permissions = await prisma.permission.findMany({
      select: {
        resource: true,
        action: true,
        category: true,
      },
      orderBy: [
        { resource: 'asc' },
        { action: 'asc' },
      ],
    });

    console.log('\nExisting permissions:');
    permissions.forEach(p => {
      console.log(`  ${p.resource}:${p.action}${p.category ? ` (${p.category})` : ''}`);
    });

    const roles = await prisma.role.findMany({
      include: {
        _count: {
          select: { permissions: true, userRoles: true },
        },
      },
    });

    console.log(`\nTotal roles: ${roles.length}`);
    roles.forEach(r => {
      console.log(`  ${r.name}: ${r._count.permissions} permissions, ${r._count.userRoles} users`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPermissions();
