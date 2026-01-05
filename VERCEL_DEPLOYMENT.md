# Vercel Deployment Guide

This guide will help you deploy the Elevate Ballers website to Vercel.

## Prerequisites

- A Vercel account (sign up at [vercel.com](https://vercel.com))
- Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
- A PostgreSQL database (Vercel Postgres, Supabase, Neon, or any PostgreSQL provider)

## Step 1: Prepare Your Repository

1. Ensure all changes are committed and pushed to your Git repository
2. The project is already configured with:
   - `@astrojs/vercel` adapter
   - `vercel.json` configuration file
   - Build script that includes Prisma generation

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Import your Git repository
4. Vercel will auto-detect Astro framework
5. Configure the following:

   **Build Settings:**
   - Framework Preset: `Astro`
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `dist` (auto-detected)
   - Install Command: `npm install` (auto-detected)

   **Root Directory:** Leave as `.` (root)

6. Click **"Deploy"**

### Option B: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. For production deployment:
   ```bash
   vercel --prod
   ```

## Step 3: Configure Environment Variables

After your first deployment, you need to add environment variables in the Vercel dashboard:

1. Go to your project in Vercel dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db?schema=public` |
| `JWT_SECRET` | Secret key for JWT tokens | Generate with: `openssl rand -base64 32` |
| `NODE_ENV` | Environment mode | `production` |

### Optional Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `FEATURE_FLAG_*` | Feature flags (see `.env.production` for examples) | `FEATURE_FLAG_HOME_POST_SLIDER=true` |
| `FEATURE_FLAGS` | JSON format for multiple flags | `{"home.postSlider":true}` |

### Setting Environment Variables

1. Click **"Add New"**
2. Enter the variable name (e.g., `DATABASE_URL`)
3. Enter the value
4. Select environments:
   - ✅ **Production**
   - ✅ **Preview** (optional, for branch deployments)
   - ✅ **Development** (optional, for local development)
5. Click **"Save"**

### Important Notes:

- **Never commit `.env` files** to Git (they're already in `.gitignore`)
- Use **different secrets** for production and development
- **Regenerate `JWT_SECRET`** for production (don't use the example value)
- For **Vercel Postgres**: The `DATABASE_URL` is automatically provided if you use Vercel Postgres

## Step 4: Database Setup

### Option A: Use Vercel Postgres (Recommended)

1. In your Vercel project dashboard, go to **Storage** tab
2. Click **"Create Database"** → Select **Postgres**
3. Choose a plan and region
4. The `DATABASE_URL` will be automatically added as an environment variable
5. Run migrations:
   ```bash
   # Connect to your production database and run:
   npx prisma migrate deploy
   ```

### Option B: Use External PostgreSQL

If using Supabase, Neon, or another provider:

1. Get your connection string from your database provider
2. Add it as `DATABASE_URL` environment variable in Vercel
3. Ensure the connection string uses SSL (most cloud providers require this)
4. Run migrations:
   ```bash
   # Set DATABASE_URL and run:
   npx prisma migrate deploy
   ```

### Running Database Migrations

You have two options:

**Option 1: Run migrations locally**
```bash
# Set your production DATABASE_URL
export DATABASE_URL="your-production-connection-string"
npx prisma migrate deploy
```

**Option 2: Use Vercel's build process**
Add a postinstall script to `package.json`:
```json
"postinstall": "prisma generate"
```

Migrations should be run manually before deployment or via a CI/CD pipeline.

## Step 5: Verify Deployment

1. After deployment completes, Vercel will provide a URL (e.g., `your-app.vercel.app`)
2. Visit the URL to verify the site is working
3. Check the **Functions** tab in Vercel dashboard to see API routes
4. Test critical functionality:
   - Homepage loads
   - API endpoints work
   - Database connections work
   - Authentication works (if applicable)

## Step 6: Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain (e.g., `elevateballers.com`)
3. Follow DNS configuration instructions
4. Vercel will automatically provision SSL certificates

## Troubleshooting

### Build Failures

**Issue:** Build fails with Prisma errors
- **Solution:** Ensure `prisma generate` runs before build (already in build script)

**Issue:** Build fails with missing dependencies
- **Solution:** Check that all dependencies are in `package.json`, not just `package-lock.json`

### Runtime Errors

**Issue:** Database connection errors
- **Solution:** 
  - Verify `DATABASE_URL` is set correctly
  - Check database allows connections from Vercel IPs
  - Ensure connection string uses SSL if required

**Issue:** Environment variables not working
- **Solution:**
  - Redeploy after adding environment variables
  - Check variable names match exactly (case-sensitive)
  - Verify variables are set for the correct environment (Production/Preview)

**Issue:** API routes timeout
- **Solution:** 
  - Check `vercel.json` has appropriate `maxDuration` settings
  - Optimize database queries
  - Consider using Vercel Edge Functions for faster responses

### Function Timeouts

If your API routes are timing out:
- Increase `maxDuration` in `vercel.json` (default is 10s, max is 60s for Hobby plan)
- Optimize your database queries
- Consider caching strategies

## Monitoring

- **Vercel Analytics:** Enable in project settings for performance monitoring
- **Logs:** Check **Deployments** → **Functions** → **Logs** for runtime errors
- **Real-time:** Use Vercel's real-time logs during deployment

## Continuous Deployment

Vercel automatically deploys:
- **Production:** Pushes to your main branch (usually `main` or `master`)
- **Preview:** Pushes to other branches and pull requests

Configure branch protection in **Settings** → **Git** if needed.

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Astro Deployment Guide](https://docs.astro.build/en/guides/deploy/vercel/)
- [Prisma with Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Review this guide
3. Check [Vercel Community](https://github.com/vercel/vercel/discussions)
4. Review [Astro Discord](https://astro.build/chat)

---

**Last Updated:** January 2025

