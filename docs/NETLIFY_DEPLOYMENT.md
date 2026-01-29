# Netlify Deployment Guide

This guide will help you deploy the Elevate Ballers website to Netlify.

## Prerequisites

- A Netlify account (sign up at [netlify.com](https://netlify.com))
- Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
- A PostgreSQL database (Supabase, Neon, or any PostgreSQL provider)

## Step 1: Prepare Your Repository

1. Ensure all changes are committed and pushed to your Git repository
2. The project is configured with:
   - `@astrojs/netlify` adapter
   - `netlify.toml` configuration file
   - Build script that includes Prisma generation

## Step 2: Deploy to Netlify

### Option A: Deploy via Netlify Dashboard (Recommended)

1. Go to [app.netlify.com](https://app.netlify.com) and sign in
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect your Git repository (GitHub, GitLab, or Bitbucket)
4. Netlify will auto-detect Astro framework
5. Configure the following:

   **Build Settings:**
   - Build command: `npm run build` (auto-detected)
   - Publish directory: `.netlify` (auto-detected by Astro adapter)
   - Base directory: `.` (root)

6. Click **"Deploy site"**

### Option B: Deploy via Netlify CLI

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Login to Netlify:
   ```bash
   netlify login
   ```

3. Initialize and deploy:
   ```bash
   netlify init
   netlify deploy --prod
   ```

## Step 3: Configure Environment Variables

After your first deployment, you need to add environment variables in the Netlify dashboard:

1. Go to your site in Netlify dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add the following variables:

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db?schema=public` |
| `JWT_SECRET` | Secret key for JWT tokens | Generate with: `openssl rand -base64 32` |
| `NODE_ENV` | Set to `production` | `production` |

### Optional Environment Variables

- Feature flags (if using the feature flag system)
- Any other custom environment variables your app needs

**Important:** After adding environment variables, you need to trigger a new deployment:
- Go to **Deploys** tab
- Click **Trigger deploy** → **Deploy site**

## Step 4: Database Setup

### Run Database Migrations

You have two options:

**Option 1: Run migrations locally**
```bash
# Set your production DATABASE_URL
export DATABASE_URL="your-production-connection-string"
npx prisma migrate deploy
```

**Option 2: Use Netlify Build Plugin**
The `postinstall` script in `package.json` ensures Prisma Client is generated during build.

Migrations should be run manually before deployment or via a CI/CD pipeline.

## Step 5: Verify Deployment

1. After deployment completes, Netlify will provide a URL (e.g., `your-app.netlify.app`)
2. Visit the URL to verify the site is working
3. Check the **Functions** tab in Netlify dashboard to see serverless functions
4. Test critical functionality:
   - Homepage loads
   - API endpoints work
   - Database connections work
   - Authentication works (if applicable)

## Step 6: Custom Domain (Optional)

1. Go to **Site settings** → **Domain management**
2. Click **Add custom domain**
3. Enter your domain (e.g., `elevateballers.com`)
4. Follow DNS configuration instructions
5. Netlify will automatically provision SSL certificates via Let's Encrypt

## Troubleshooting

### Build Failures

**Issue:** Build fails with Prisma errors
- **Solution:** Ensure `prisma generate` runs before build (already in build script and postinstall)

**Issue:** Build fails with missing dependencies
- **Solution:** Check that all dependencies are in `package.json`, not just `package-lock.json`

**Issue:** Build fails with module not found errors
- **Solution:** Ensure `@astrojs/netlify` is installed and `netlify.toml` is configured correctly

### Runtime Errors

**Issue:** Database connection errors
- **Solution:** 
  - Verify `DATABASE_URL` is set correctly in Netlify environment variables
  - Check database allows connections from Netlify IPs
  - Ensure connection string uses SSL if required
  - For Supabase, use the connection pooler URL

**Issue:** Environment variables not working
- **Solution:**
  - Redeploy after adding environment variables (they don't apply to existing deployments)
  - Check variable names match exactly (case-sensitive)
  - Verify variables are set for the correct environment (Production/Branch deploys)

**Issue:** Function timeouts
- **Solution:**
  - Netlify Functions have a 10-second timeout on the free tier, 26 seconds on Pro
  - Optimize database queries
  - Consider using Netlify Edge Functions for faster responses
  - Check `netlify.toml` for function configuration

### Function Timeouts

If your API routes are timing out:
- Optimize your database queries
- Consider caching strategies
- Use Netlify Edge Functions for read-heavy operations
- Upgrade to Netlify Pro for longer function timeouts (26s)

## Configuration Files

### netlify.toml

The `netlify.toml` file includes:
- Build command and publish directory
- Node.js version
- Redirect rules for SPA routing
- Security headers
- Caching headers for static assets
- Function configuration

### Build Process

1. `npm install` - Installs dependencies
2. `postinstall` - Runs `prisma generate` (ensures Prisma Client is available)
3. `npm run build` - Runs `prisma generate && astro build`
4. Netlify adapter generates serverless functions in `.netlify` directory

## Monitoring

- **Netlify Analytics:** Enable in site settings for traffic monitoring
- **Function Logs:** Check **Functions** → **Logs** for runtime errors
- **Deploy Logs:** Check **Deploys** → **Deploy log** for build errors
- **Real-time:** Use Netlify's deploy notifications

## Continuous Deployment

Netlify automatically deploys:
- **Production:** Pushes to your main branch (usually `main` or `master`)
- **Branch Deploys:** Pushes to other branches (preview deployments)
- **Pull Request Deploys:** Automatic preview deployments for PRs

Configure branch protection in **Site settings** → **Build & deploy** → **Deploy contexts** if needed.

## Performance Optimization

1. **Enable Edge Functions:** For faster API responses
2. **Use CDN:** Netlify automatically uses their CDN for static assets
3. **Image Optimization:** Consider using Netlify Image CDN
4. **Caching:** Configured in `netlify.toml` for static assets

## Additional Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [Astro Deployment Guide](https://docs.astro.build/en/guides/deploy/netlify/)
- [Prisma with Netlify](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-netlify)
- [Netlify Functions](https://docs.netlify.com/functions/overview/)

## Support

If you encounter issues:
1. Check Netlify deploy logs
2. Review this guide
3. Check [Netlify Community](https://answers.netlify.com/)
4. Review [Astro Discord](https://astro.build/chat)

---

**Last Updated:** January 2025

