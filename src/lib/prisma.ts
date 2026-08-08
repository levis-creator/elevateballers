// Conditional server-only Prisma loader.
// `import.meta.env.SSR` is replaced at build time by Vite. Keeping both
// adapter imports inside this branch prevents Node and MariaDB modules from
// entering hydrated browser islands when a shared module is imported there.
import type { PrismaClient } from '@prisma/client';

let prismaInstance: PrismaClient;

if (import.meta.env.SSR) {
  const isVercel = process.env.VERCEL === '1' || process.env.DEPLOY_TARGET === 'vercel';

  if (!process.env.VERCEL && !process.env.DEPLOY_TARGET) {
    console.warn(
      '[prisma] DEPLOY_TARGET is not set. Defaulting to cPanel (CommonJS) mode. ' +
      'Set DEPLOY_TARGET=vercel or VERCEL=1 for Vercel deployments.'
    );
  }

  if (isVercel) {
    const mod = await import('./prisma.vercel');
    prismaInstance = mod.prisma;
  } else {
    const mod = await import('./prisma.cpanel');
    prismaInstance = mod.prisma;
  }
} else {
  // Fail only if browser code actually tries to use the database. A proxy
  // keeps accidental type/helper imports harmless while preserving a clear
  // runtime error for an invalid client-side query.
  prismaInstance = new Proxy({} as PrismaClient, {
    get() {
      throw new Error('Prisma is server-only and cannot be used in browser code.');
    },
  });
}

export const prisma = prismaInstance;
