import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from 'dotenv';

config();
const globalForPrisma = globalThis;
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}
const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 3e4,
  connectionTimeoutMillis: 2e3
});
const adapter = new PrismaPg(pool);
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
const newPrisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"]
});
try {
  if (!hasModel(newPrisma, "staff")) {
    console.warn("WARNING: Prisma client may be missing staff model. If you see errors, run: npx prisma generate");
  }
} catch (error) {
  console.warn("Could not verify Prisma models. If you see errors, run: npx prisma generate");
}
const prisma = cachedPrisma ?? newPrisma;
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.schemaVersion = SCHEMA_VERSION;
}

export { prisma as p };
