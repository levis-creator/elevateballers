# Why Local Build is Different from Development

## The Problem

When you run `npm run start:local`, you're using:
- **Node adapter** (`astro.config.local.mjs`) - Different from production!
- **Production uses Vercel adapter** (`astro.config.mjs`)

These adapters behave differently, so your local build won't match production.

## Key Differences

### Node Adapter (`npm run start:local`)
- Uses Node.js server
- Different routing mechanism
- Different serverless function handling
- Different environment variable loading
- Runs at `http://localhost:4321`

### Vercel Adapter (Production)
- Uses Vercel serverless functions
- Vercel-specific routing
- Different build output structure
- Different environment variable handling
- Deployed to Vercel platform

### Development Mode (`npm run dev`)
- Uses Vercel adapter in dev mode
- Hot reload
- Uses local `.env` file
- Runs at `http://localhost:4321`

## How to Properly Test Production

### Option 1: Use Vercel CLI (Best Match to Production)

```bash
# 1. Build with Vercel adapter (production config)
npm run build:clean

# 2. Pull production environment variables
vercel env pull .env.production

# 3. Run with Vercel CLI (uses Vercel adapter)
npm run preview:vercel
# or: vercel dev
```

This uses the **same Vercel adapter** as production!

### Option 2: Test Actual Production

```bash
# Deploy to production
git push

# Then test at your production URL
# This is the most accurate test
```

### Option 3: Use Development Mode

```bash
npm run dev
```

This uses the Vercel adapter (same as production) but in development mode.

## Comparison Table

| Method | Adapter | Environment | Best For |
|--------|---------|-------------|----------|
| `npm run dev` | Vercel | Local `.env` | Development |
| `npm run start:local` | Node | Local `.env` | ❌ Not recommended (different adapter) |
| `npm run preview:vercel` | Vercel | Production env vars | Testing production locally |
| Production URL | Vercel | Production env vars | ✅ Most accurate |

## Why Node Adapter is Different

The Node adapter:
- Creates a Node.js server
- Different request handling
- Different middleware behavior
- Different static file serving
- Different API route handling

The Vercel adapter:
- Creates serverless functions
- Vercel-specific optimizations
- Different routing
- Different caching behavior

## Recommended Workflow

1. **Development:** Use `npm run dev` (Vercel adapter, local env)
2. **Pre-deployment testing:** Use `npm run preview:vercel` (Vercel adapter, production env)
3. **Final testing:** Test actual production URL

## Quick Fix

**Don't use `npm run start:local` for production testing!**

Instead:
```bash
# Test with Vercel adapter (matches production)
npm run build:clean
vercel env pull .env.production
npm run preview:vercel
```

Or just test the actual production deployment after pushing.

---

**Summary:** `npm run start:local` uses Node adapter (different from production). Use `npm run preview:vercel` or test actual production instead.

