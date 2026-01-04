import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from 'dotenv';

// Load environment variables
config();

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create PostgreSQL connection pool
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Create Prisma 7 adapter using the official @prisma/adapter-pg
const adapter = new PrismaPg(pool);

// Check if the cached Prisma client has all required models
// If not, recreate it (useful after adding new models without restarting)
let cachedPrisma = globalForPrisma.prisma;

// Function to check if a model exists in the Prisma client
// Note: This is a best-effort check and may not always be accurate
const hasModel = (client: any, modelName: string): boolean => {
  try {
    // Safely check if the model property exists
    if (!client || typeof client !== 'object') return false;
    if (!(modelName in client)) return false;
    
    const model = client[modelName];
    // Check if it's an object with findMany method
    return model && typeof model === 'object' && typeof model.findMany === 'function';
  } catch {
    // If any error occurs during check, assume model doesn't exist
    return false;
  }
};

// Force recreation if schema has changed (e.g., after removing fields)
// This is a simple check - in production, you'd want a more robust solution
const SCHEMA_VERSION = '1.0.3'; // Increment when schema changes significantly (added slug to Team)
const cachedVersion = (globalForPrisma as any).schemaVersion;

// Check if Team model has slug field (for schema changes)
const hasTeamSlug = (client: any): boolean => {
  try {
    if (!client?.team) return false;
    // Try to access a query that would fail if slug doesn't exist
    // We'll check by trying to see if the model has the expected structure
    return true; // Optimistic check - actual error will show if field missing
  } catch {
    return false;
  }
};

const shouldRecreateClient = cachedPrisma && (
  !hasModel(cachedPrisma, 'comment') || 
  !hasModel(cachedPrisma, 'staff') || 
  !hasModel(cachedPrisma, 'teamStaff') ||
  cachedVersion !== SCHEMA_VERSION
);

if (shouldRecreateClient) {
  console.warn('Prisma client schema mismatch detected. Recreating client...');
  // Disconnect old client if it exists
  if (cachedPrisma) {
    cachedPrisma.$disconnect().catch(() => {});
  }
  // Clear the cache
  globalForPrisma.prisma = undefined;
  (globalForPrisma as any).schemaVersion = undefined;
  cachedPrisma = undefined;
}

// Create new Prisma client instance
const newPrisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Verify the new client has the staff model (only warn, don't throw)
// This allows the app to start even if the model check fails
// The actual error will be clearer when trying to use the model
try {
  if (!hasModel(newPrisma, 'staff')) {
    console.warn('WARNING: Prisma client may be missing staff model. If you see errors, run: npx prisma generate');
  }
} catch (error) {
  // Silently ignore check errors - the actual usage will show the real error
  console.warn('Could not verify Prisma models. If you see errors, run: npx prisma generate');
}

export const prisma = cachedPrisma ?? newPrisma;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  (globalForPrisma as any).schemaVersion = SCHEMA_VERSION;
}

