// Conditional Prisma client loader
// - Vercel: Use ESM imports (prisma.vercel.ts) for proper bundling
// - cPanel: Use CommonJS require (prisma.cpanel.ts) for compatibility
//
// Set DEPLOY_TARGET=vercel or VERCEL=1 for Vercel deployments.
// Defaults to cPanel mode when neither is set.

const isVercel = process.env.VERCEL === '1' || process.env.DEPLOY_TARGET === 'vercel';

if (!process.env.VERCEL && !process.env.DEPLOY_TARGET) {
  console.warn(
    '[prisma] DEPLOY_TARGET is not set. Defaulting to cPanel (CommonJS) mode. ' +
    'Set DEPLOY_TARGET=vercel or VERCEL=1 for Vercel deployments.'
  );
}

let prismaInstance;

if (isVercel) {
  // ESM-based client for Vercel (allows Vite to bundle it correctly)
  const mod = await import('./prisma.vercel');
  prismaInstance = mod.prisma;
} else {
  // CommonJS-based client for cPanel
  const mod = await import('./prisma.cpanel');
  prismaInstance = mod.prisma;
}

export const prisma = prismaInstance;
