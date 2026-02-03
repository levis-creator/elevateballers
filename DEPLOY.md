# Quick Deployment Guide

## ✅ Changes Made to Fix Vercel Deployment

1. ✅ Added `rhel-openssl-3.0.x` binary target to Prisma schema
2. ✅ Updated Astro config to bundle Prisma for Vercel (not mark as external)
3. ✅ Added `postinstall` script to auto-generate Prisma Client
4. ✅ Removed deprecated `functionPerRoute` option
5. ✅ Created `.vercelignore` file
6. ✅ Updated `vercel.json` with proper configuration

## 🚀 Deploy Now

### Option 1: Automatic Deployment (Recommended)
```bash
git add .
git commit -m "fix: Configure Prisma for Vercel serverless deployment"
git push
```
Vercel will automatically deploy when you push to your connected branch.

### Option 2: Manual Deployment
```bash
npm run deploy
```

## ⚙️ Before Deploying - Check Environment Variables

Make sure these are set in Vercel Dashboard → Settings → Environment Variables:

- `DATABASE_URL` - Your MySQL/MariaDB connection string
- Any other env vars from your `.env` file

## 🔍 Verify Deployment

After deployment, check:

1. **Build Logs**: Look for "✓ Generated Prisma Client"
2. **Function Logs**: Check for any runtime errors
3. **Test Endpoints**: Try accessing your API routes

## 🐛 If Issues Persist

1. **Clear Vercel cache and redeploy**:
   - Vercel Dashboard → Deployments → ⋯ → Redeploy → ✓ Clear cache

2. **Check build logs** for:
   - "Prisma schema loaded from prisma/schema.prisma"
   - "Generated Prisma Client to ./node_modules/@prisma/client"

3. **Verify binary targets** in build logs:
   - Should show: native, debian-openssl-1.1.x, rhel-openssl-3.0.x

## 📚 Full Documentation

See `VERCEL_DEPLOYMENT_FIX.md` for complete details and troubleshooting.
