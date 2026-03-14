// cPanel-specific Prisma client using CommonJS require
import { createRequire } from 'node:module';
import type { PrismaClient as PrismaClientInstance } from '@prisma/client';
import { config } from 'dotenv';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client') as { PrismaClient: new (args?: object) => PrismaClientInstance };
const { PrismaMariaDb } = require('@prisma/adapter-mariadb') as typeof import('@prisma/adapter-mariadb');

// Load environment variables
config();

interface GlobalWithPrisma {
    prisma?: PrismaClientInstance;
}
const globalForPrisma = globalThis as GlobalWithPrisma;

let adapter: any = null;

function getAdapter() {
    if (!adapter) {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) throw new Error('DATABASE_URL is not set');

        const url = new URL(connectionString);
        const poolConfig = {
            host: url.hostname,
            port: parseInt(url.port) || 3306,
            user: decodeURIComponent(url.username),
            password: decodeURIComponent(url.password),
            database: url.pathname.slice(1),
            connectionLimit: 5,
            idleTimeout: 10000,
            connectTimeout: 30000,
            acquireTimeout: 30000,
            allowPublicKeyRetrieval: true,
        };

        adapter = new PrismaMariaDb(poolConfig);
    }
    return adapter;
}

function createPrismaClient(): PrismaClientInstance {
    return new PrismaClient({
        adapter: getAdapter(),
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
}

const newPrisma = createPrismaClient();
export const prisma = globalForPrisma.prisma ?? newPrisma;

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
