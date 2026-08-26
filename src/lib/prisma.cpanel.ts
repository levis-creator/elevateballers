// cPanel-specific Prisma client using CommonJS require
import { createRequire } from 'node:module';
import type { PrismaClient as PrismaClientInstance } from '@prisma/client';
import dotenv from 'dotenv';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client') as { PrismaClient: new (args?: object) => PrismaClientInstance };
const { PrismaMariaDb } = require('@prisma/adapter-mariadb') as typeof import('@prisma/adapter-mariadb');

// Load environment variables
dotenv.config();

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
        const allowPublicKeyRetrieval =
            process.env.DB_ALLOW_PUBLIC_KEY_RETRIEVAL === 'true' ||
            process.env.NODE_ENV !== 'production';
        const poolConfig = {
            host: url.hostname,
            port: parseInt(url.port) || 3306,
            user: decodeURIComponent(url.username),
            password: decodeURIComponent(url.password),
            database: url.pathname.slice(1),
            // Keep this configurable for shared cPanel plans. Start at 5 and
            // lower it if the hosting account has a smaller MySQL allowance.
            connectionLimit: Math.max(1, Number.parseInt(process.env.DB_POOL_LIMIT || '5', 10) || 5),
            idleTimeout: 10000,
            connectTimeout: 30000,
            acquireTimeout: 30000,
            allowPublicKeyRetrieval,
        };

        adapter = new PrismaMariaDb(poolConfig);
    }
    return adapter;
}

function createPrismaClient(): PrismaClientInstance {
    const queryDiagnostics = process.env.DB_QUERY_DIAGNOSTICS === 'true';
    return new PrismaClient({
        adapter: getAdapter(),
        log: queryDiagnostics ? [{ emit: 'event', level: 'query' }, 'error', 'warn'] : process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
}

const newPrisma = createPrismaClient();
export const prisma = globalForPrisma.prisma ?? newPrisma;

if (process.env.DB_QUERY_DIAGNOSTICS === 'true') {
    prisma.$on('query', (event) => {
        console.info(`[db] ${event.duration}ms ${event.query.split(/\s+/).slice(0, 8).join(' ')}…`);
    });
}

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
