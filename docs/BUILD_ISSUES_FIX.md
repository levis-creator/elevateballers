# Build Issues Fix - Changes Not Appearing in Production

## Problem
Latest features and changes made in development are not applying in the build/production.

## Common Causes & Solutions

### 1. **Vercel Build Cache** (Most Common)

Vercel caches builds to speed up deployments. If your changes aren't appearing, the cache might be stale.

**Solution:**
1. Go to Vercel Dashboard → Your Project → Settings → General
2. Scroll to "Build & Development Settings"
3. Click "Clear Build Cache" or "Redeploy" with "Clear Cache" option
4. Or trigger a new deployment with cache cleared:
   ```bash
   vercel --prod --force
   ```

### 2. **Files Not Committed to Git**

Vercel builds from your Git repository. If files aren't committed, they won't be in the build.

**Check:**
```bash
git status
```

**Solution:**
```bash
git add .
git commit -m "Add latest features"
git push
```

### 3. **Prisma Client Not Regenerated**

If you changed the Prisma schema, the client needs to be regenerated.

**Solution:**
The build script already includes `prisma generate`, but if issues persist:

1. **Clear Prisma cache locally:**
   ```bash
   rm -rf node_modules/.prisma
   rm -rf node_modules/@prisma/client
   npm run db:generate
   ```

2. **Force Prisma regeneration in build:**
   - The build script already runs `prisma generate && astro build`
   - If needed, you can add a prebuild script

### 4. **Build Output Directory Issues**

Astro outputs to `dist/` by default. Ensure Vercel is configured correctly.

**Check Vercel Settings:**
- Build Command: `npm run build` (should match package.json)
- Output Directory: `dist` (for Astro)
- Install Command: `npm install`

### 5. **Environment Variables Not Set**

Some features might depend on environment variables that aren't set in production.

**Check:**
1. Vercel Dashboard → Settings → Environment Variables
2. Ensure all required variables are set for Production environment
3. Redeploy after adding variables

### 6. **Astro Build Cache**

Astro caches build artifacts in `.astro/` directory.

**Solution:**
Add to your build script to clear cache:
```json
"build": "rm -rf .astro dist && prisma generate && astro build"
```

Or manually:
```bash
rm -rf .astro dist
npm run build
```

### 7. **Vercel Function Cache**

Serverless functions might be cached.

**Solution:**
- Clear Vercel build cache (see #1)
- Or add cache headers to prevent caching during development

## Quick Fix Checklist

Run through these steps:

1. ✅ **Commit all changes to Git**
   ```bash
   git add .
   git commit -m "Latest changes"
   git push
   ```

2. ✅ **Clear local build cache**
   ```bash
   rm -rf .astro dist node_modules/.prisma
   npm install
   npm run build
   ```

3. ✅ **Clear Vercel build cache**
   - Vercel Dashboard → Settings → Clear Build Cache
   - Or redeploy with `--force` flag

4. ✅ **Verify build settings in Vercel**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Node Version: 18.x or 20.x

5. ✅ **Check environment variables**
   - All required vars set in Vercel
   - Redeploy after adding variables

6. ✅ **Verify Prisma schema is committed**
   ```bash
   git ls-files | grep prisma/schema.prisma
   ```

## Enhanced Build Script

Update your `package.json` build script to be more robust:

```json
{
  "scripts": {
    "build": "prisma generate && astro build",
    "build:clean": "rm -rf .astro dist && npm run build",
    "prebuild": "prisma generate"
  }
}
```

## Debugging Steps

### 1. Check Build Logs

1. Go to Vercel Dashboard → Deployments
2. Click on the latest deployment
3. Check "Build Logs" for errors
4. Look for:
   - Prisma generation messages
   - File compilation errors
   - Missing dependencies

### 2. Compare Local vs Production Build

**Local:**
```bash
npm run build
ls -la dist/
```

**Production:**
- Check Vercel build logs for output directory contents
- Compare file sizes and timestamps

### 3. Check Git Status

Ensure all files are tracked:
```bash
git status
git ls-files | grep -E "\.(tsx?|astro|ts|js)$" | head -20
```

### 4. Verify File Changes Are in Git

```bash
# See what changed
git diff HEAD~1 HEAD --name-only

# Check if specific file is in repo
git ls-files src/features/layout/components/Header.astro
```

## Common File Issues

### Files in .gitignore

Check if important files are being ignored:
```bash
cat .gitignore
```

**Important:** These should NOT be in .gitignore:
- `src/**/*` (source files)
- `prisma/schema.prisma`
- `astro.config.mjs`
- `package.json`

### Files That SHOULD Be Ignored:
- `dist/` ✅
- `.astro/` ✅
- `node_modules/` ✅
- `.env` ✅

## Vercel-Specific Issues

### 1. Build Timeout

If builds are timing out:
- Check Vercel Dashboard → Settings → Functions
- Increase `maxDuration` if needed
- Optimize build process

### 2. Memory Issues

If builds fail due to memory:
- Vercel Hobby plan: 1024 MB
- Upgrade plan if needed
- Optimize dependencies

### 3. Node Version Mismatch

Ensure consistent Node version:
- Local: Check `node --version`
- Vercel: Settings → General → Node.js Version
- Should match (18.x or 20.x recommended)

## Force Fresh Build

If nothing else works, force a completely fresh build:

```bash
# 1. Clear all local caches
rm -rf .astro dist node_modules/.prisma node_modules/@prisma/client

# 2. Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# 3. Regenerate Prisma
npm run db:generate

# 4. Build locally to test
npm run build

# 5. Commit and push
git add .
git commit -m "Force fresh build"
git push

# 6. In Vercel, clear build cache and redeploy
```

## Verification

After deploying, verify changes:

1. **Check build logs** for your changes being compiled
2. **Test the feature** in production
3. **Check browser console** for errors
4. **Compare** production vs local behavior
5. **Check Vercel function logs** for runtime errors

## Still Not Working?

If changes still don't appear:

1. **Check if it's a caching issue:**
   - Hard refresh browser (Ctrl+Shift+R)
   - Clear browser cache
   - Test in incognito mode

2. **Verify the change is actually in the code:**
   - Check the file in production build logs
   - Compare file contents

3. **Check for conditional rendering:**
   - Feature flags might be disabling features
   - Environment checks might hide features
   - Check `src/lib/feature-flags.ts`

4. **Database-related changes:**
   - Schema changes need migrations
   - Data changes need to be in production DB
   - Check `DATABASE_URL` is correct

---

**Last Updated**: January 2025

