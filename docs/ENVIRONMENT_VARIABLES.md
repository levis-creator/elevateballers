# Environment Variables Setup Guide

This guide explains how to ensure your environment variables are correctly configured for both local development and production (Vercel).

## The Problem

If you're experiencing differences between local development and production, it's likely due to environment variables not being properly set in your Vercel dashboard. The `.env.production` file is **NOT automatically used** in production - it's only for reference.

## How Environment Variables Work

### Local Development
- Uses `.env` file (loaded automatically by dotenv)
- Variables are accessible via `process.env` and `import.meta.env`

### Production (Vercel)
- **MUST** be set in Vercel Dashboard → Settings → Environment Variables
- The `.env.production` file is **NOT** automatically loaded
- Variables are provided by Vercel's platform

## Required Environment Variables

You **MUST** set these in your Vercel dashboard:

### 1. DATABASE_URL
- **Description**: PostgreSQL connection string
- **Example**: `postgresql://user:password@host:5432/database?schema=public`
- **Where to get it**: From your database provider (Supabase, Vercel Postgres, Neon, etc.)
- **Important**: Use the production database URL, not the local one

### 2. JWT_SECRET
- **Description**: Secret key for JWT token signing
- **How to generate**: `openssl rand -base64 32`
- **Important**: Use a different secret for production than development
- **Security**: Never commit this to Git

### 3. NODE_ENV
- **Description**: Environment mode
- **Value**: `production`
- **Important**: This affects how the app behaves (logging, error handling, etc.)

## Optional Environment Variables

### Feature Flags
You can control feature flags using environment variables:

**Individual flags:**
```
FEATURE_FLAG_HOME_POST_SLIDER=true
FEATURE_FLAG_HOME_NEWS_TICKER=false
```

**JSON format (multiple flags):**
```
FEATURE_FLAGS={"home.postSlider":true,"home.newsTicker":false}
```

## How to Set Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Click **"Add New"**
4. Enter the variable name (e.g., `DATABASE_URL`)
5. Enter the value
6. Select environments:
   - ✅ **Production** (required)
   - ✅ **Preview** (optional, for branch deployments)
   - ✅ **Development** (optional, for local development with `vercel dev`)
7. Click **"Save"**

## After Setting Environment Variables

**Important**: After adding or updating environment variables in Vercel:

1. **Redeploy your application** - Environment variables are only available after a new deployment
2. Go to **Deployments** tab
3. Click the **"..."** menu on your latest deployment
4. Select **"Redeploy"**

Or trigger a new deployment by:
- Pushing a new commit to your repository
- Running `vercel --prod` from the CLI

## Verifying Environment Variables

### In Vercel Dashboard
1. Go to **Deployments** → Select a deployment → **Functions** → Click on a function
2. Check the **Logs** tab - you should see your environment variables being used

### Testing Locally
To test with production-like environment variables locally:

1. Copy values from `.env.production` to `.env`
2. Or use `vercel dev` which loads environment variables from Vercel

## Common Issues

### Issue: Environment variables work locally but not in production
**Solution**: 
- Check that variables are set in Vercel dashboard (not just in `.env.production`)
- Ensure you've redeployed after adding variables
- Verify variable names match exactly (case-sensitive)

### Issue: Database connection fails in production
**Solution**:
- Verify `DATABASE_URL` is set correctly in Vercel
- Check that the database allows connections from Vercel IPs
- Ensure connection string uses SSL if required (add `?sslmode=require`)

### Issue: JWT authentication fails in production
**Solution**:
- Verify `JWT_SECRET` is set in Vercel dashboard
- Ensure it's different from your development secret
- Redeploy after setting the variable

### Issue: Feature flags not working in production
**Solution**:
- Feature flags use `FEATURE_FLAG_*` prefix
- Set them in Vercel dashboard with the exact name
- Redeploy after adding feature flag variables

## Code Changes Made

The following improvements have been made to ensure environment variables work consistently:

1. **`src/lib/prisma.ts`**: Updated to not override production environment variables with dotenv
2. **`src/lib/feature-flags.ts`**: Added fallback to `process.env` for server-side code
3. **`src/lib/env.ts`**: New helper module for consistent environment variable access
4. **`src/features/cms/lib/auth.ts`**: Updated to use the new env helper

## Quick Checklist

- [ ] `DATABASE_URL` is set in Vercel dashboard
- [ ] `JWT_SECRET` is set in Vercel dashboard (different from development)
- [ ] `NODE_ENV` is set to `production` in Vercel dashboard
- [ ] All feature flags (if any) are set in Vercel dashboard
- [ ] Application has been redeployed after setting variables
- [ ] Tested the application in production to verify it works

## Need Help?

If you're still experiencing issues:

1. Check Vercel deployment logs for error messages
2. Verify all required environment variables are set
3. Ensure you've redeployed after adding variables
4. Compare `.env` (local) with Vercel dashboard settings

---

**Last Updated**: January 2025

