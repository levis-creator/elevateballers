# Vercel Deployment Fix: Prisma Client Module Not Found

## Problem Summary
The error `Cannot find module '@prisma/client'` occurs during Vercel deployment because:

1. **Binary targets mismatch**: Prisma schema didn't include the correct binary for Vercel's AWS Lambda runtime
2. **Bundling configuration**: Prisma Client was marked as external in SSR config, preventing it from being bundled
3. **Missing postinstall hook**: No automatic Prisma Client generation after dependency installation

## Changes Made

### 1. Updated Prisma Schema (`prisma/schema.prisma`)
**Added `rhel-openssl-3.0.x` binary target for Vercel's AWS Lambda (Amazon Linux 2023):**

```prisma
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "debian-openssl-1.1.x", "rhel-openssl-3.0.x"]
}
```

**Why**: Vercel uses AWS Lambda with Amazon Linux 2023, which requires the `rhel-openssl-3.0.x` binary target.

### 2. Updated Astro Config (`astro.config.mjs`)
**Made Prisma bundling conditional based on deployment target:**

```javascript
ssr: {
  noExternal: ['lucide-react', 'react-masonry-css'],
  // Keep @prisma/client external only for cPanel (CJS interop)
  // For Vercel, bundle it with the serverless function
  external: deployTarget === 'cpanel' ? ['@prisma/client', '@prisma/adapter-mariadb'] : [],
},
```

**Why**: 
- **cPanel**: Needs Prisma as external for CommonJS interop
- **Vercel**: Needs Prisma bundled into serverless functions

**Also removed deprecated `functionPerRoute` option** from Vercel adapter config.

### 3. Added Postinstall Hook (`package.json`)
**Added automatic Prisma Client generation:**

```json
"scripts": {
  "postinstall": "prisma generate",
  ...
}
```

**Why**: Ensures Prisma Client is always generated after `npm install`, critical for Vercel's build process.

## Next Steps to Deploy

### Step 1: Regenerate Prisma Client Locally
Run this command to generate the Prisma Client with the new binary targets:

```bash
npm run db:generate
```

Or directly:
```bash
npx prisma generate
```

### Step 2: Commit and Push Changes
```bash
git add .
git commit -m "fix: Add Vercel binary target and fix Prisma bundling for serverless deployment"
git push
```

### Step 3: Redeploy to Vercel
The deployment will automatically trigger on push, or you can manually deploy:

```bash
npm run deploy
```

Or using Vercel CLI:
```bash
vercel --prod
```

### Step 4: Verify Environment Variables
Ensure these environment variables are set in your Vercel project settings:

- `DATABASE_URL`: Your MySQL/MariaDB connection string
- Any other required environment variables from your `.env` file

**To check/set environment variables:**
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Ensure `DATABASE_URL` is set for Production, Preview, and Development

## How the Fix Works

### For Vercel Deployment:
1. **Build time**: `postinstall` hook runs `prisma generate`, creating the Prisma Client with all binary targets
2. **Bundle time**: Astro bundles `@prisma/client` into the serverless function (not marked as external)
3. **Runtime**: Vercel's Lambda uses the `rhel-openssl-3.0.x` binary from the generated client

### For cPanel Deployment:
1. **Build time**: Same Prisma generation with all binaries
2. **Bundle time**: Astro keeps `@prisma/client` external for CommonJS compatibility
3. **Runtime**: cPanel uses the `debian-openssl-1.1.x` binary

## Troubleshooting

### If the error persists after deployment:

1. **Check Vercel build logs** for Prisma generation:
   - Look for "Prisma schema loaded from prisma/schema.prisma"
   - Verify all three binary targets are being generated

2. **Verify DATABASE_URL** is set in Vercel:
   ```bash
   vercel env ls
   ```

3. **Clear Vercel cache** and redeploy:
   - In Vercel dashboard: Deployments → ⋯ → Redeploy → Clear cache and redeploy

4. **Check function size**: If the bundle is too large (>50MB):
   - Vercel has size limits for serverless functions
   - May need to optimize or use Edge Runtime

### Common Issues:

**"Binary target not found"**
- Solution: Ensure `rhel-openssl-3.0.x` is in `binaryTargets` array

**"Prisma Client did not initialize yet"**
- Solution: Ensure `postinstall` script runs during Vercel build

**"Cannot connect to database"**
- Solution: Check `DATABASE_URL` environment variable in Vercel settings

## Additional Optimizations (Optional)

### Use Vercel Edge Runtime (if compatible):
```javascript
// In astro.config.mjs
vercel({
  edgeMiddleware: true,
  webAnalytics: {
    enabled: true,
  },
})
```

**Note**: Edge Runtime has limitations with Prisma. Only use if your database supports HTTP connections (like PlanetScale, Neon, etc.)

### Connection Pooling for Serverless:
Consider using a connection pooler like:
- **PgBouncer** (for PostgreSQL)
- **ProxySQL** (for MySQL/MariaDB)
- **Prisma Data Proxy** (paid service)

This prevents connection exhaustion in serverless environments.

## References

- [Prisma Binary Targets](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#binarytargets-options)
- [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
- [Astro Vercel Adapter](https://docs.astro.build/en/guides/integrations-guide/vercel/)
