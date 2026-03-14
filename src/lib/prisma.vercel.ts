// Vercel-specific Prisma client using ESM imports
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import type { PrismaClient as PrismaClientInstance } from '@prisma/client';
import { config } from 'dotenv';

// Load environment variables
config();

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
interface GlobalWithPrisma {
    prisma?: PrismaClientInstance;
}
const globalForPrisma = globalThis as GlobalWithPrisma;

// Lazy initialization of adapter
let adapter: InstanceType<typeof PrismaMariaDb> | null = null;

function getAdapter(): InstanceType<typeof PrismaMariaDb> {
    if (!adapter) {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
            throw new Error(
                'DATABASE_URL environment variable is not set. ' +
                'Please configure it in your project settings under Environment Variables.'
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
            allowPublicKeyRetrieval?: boolean;
        };

        try {
            const url = new URL(connectionString);

            poolConfig = {
                host: url.hostname,
                port: parseInt(url.port) || 3306,
                user: decodeURIComponent(url.username),
                password: decodeURIComponent(url.password),
                database: url.pathname.slice(1),
                connectionLimit: 3, // Lower limit for serverless
                idleTimeout: 10000,
                connectTimeout: 30000,
                acquireTimeout: 30000,
                allowPublicKeyRetrieval: true,
            };
        } catch (error) {
            throw new Error(
                `Invalid DATABASE_URL format: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
                'Expected format: mysql://user:password@host:port/database'
            );
        }

        adapter = new PrismaMariaDb(poolConfig);
    }
    return adapter;
}

function createPrismaClient(): PrismaClientInstance {
    try {
        return new PrismaClient({
            adapter: getAdapter(),
            log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        });
    } catch (error) {
        if (error instanceof Error && error.message.includes('DATABASE_URL')) {
            throw error;
        }
        throw new Error(
            `Failed to initialize Prisma Client: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
            'Please check your DATABASE_URL environment variable.'
        );
    }
}

// Create new Prisma client instance
const newPrisma = createPrismaClient();

export const prisma = globalForPrisma.prisma ?? newPrisma;

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
