import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from 'dotenv';

config();
const globalForPrisma = globalThis;
let pool = null;
let adapter = null;
function getConnectionPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "DATABASE_URL environment variable is not set. Please configure it in your Vercel project settings under Environment Variables. Go to: Project Settings → Environment Variables → Add DATABASE_URL"
      );
    }
    pool = new Pool({
      connectionString,
      max: process.env.NODE_ENV === "production" ? 1 : 10,
      // Single connection per function in production
      idleTimeoutMillis: 3e4,
      connectionTimeoutMillis: 5e3,
      // Increased timeout for serverless cold starts
      // Enable connection pooling for serverless (important for Vercel)
      allowExitOnIdle: true
    });
  }
  return pool;
}
function getAdapter() {
  if (!adapter) {
    adapter = new PrismaPg(getConnectionPool());
  }
  return adapter;
}
function createPrismaClient() {
  try {
    return new PrismaClient({
      adapter: getAdapter(),
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"]
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      throw error;
    }
    throw new Error(
      `Failed to initialize Prisma Client: ${error instanceof Error ? error.message : "Unknown error"}. Please check your DATABASE_URL environment variable.`
    );
  }
}
let cachedPrisma = globalForPrisma.prisma;
const hasModel = (client, modelName) => {
  try {
    if (!client || typeof client !== "object") return false;
    if (!(modelName in client)) return false;
    const model = client[modelName];
    return model && typeof model === "object" && typeof model.findMany === "function";
  } catch {
    return false;
  }
};
const SCHEMA_VERSION = "1.0.3";
const cachedVersion = globalForPrisma.schemaVersion;
const shouldRecreateClient = cachedPrisma && (!hasModel(cachedPrisma, "comment") || !hasModel(cachedPrisma, "staff") || !hasModel(cachedPrisma, "teamStaff") || cachedVersion !== SCHEMA_VERSION);
if (shouldRecreateClient) {
  console.warn("Prisma client schema mismatch detected. Recreating client...");
  if (cachedPrisma) {
    cachedPrisma.$disconnect().catch(() => {
    });
  }
  globalForPrisma.prisma = void 0;
  globalForPrisma.schemaVersion = void 0;
  cachedPrisma = void 0;
}
let newPrisma;
try {
  newPrisma = createPrismaClient();
  try {
    if (!hasModel(newPrisma, "staff")) {
      console.warn("WARNING: Prisma client may be missing staff model. If you see errors, run: npx prisma generate");
    }
  } catch (error) {
    console.warn("Could not verify Prisma models. If you see errors, run: npx prisma generate");
  }
} catch (error) {
  console.error("Failed to initialize Prisma Client:", error);
  throw error;
}
const prisma = cachedPrisma ?? newPrisma;
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.schemaVersion = SCHEMA_VERSION;
}

export { prisma as p };
