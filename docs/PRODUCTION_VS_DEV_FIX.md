# Production vs Development Discrepancies - Fix Guide

## Problems Identified

1. **Header Navigation Redirecting to Wrong Pages**
   - Header links had trailing slashes (`/teams/`) that didn't match actual routes
   - Mobile menu had incorrect link (`/players/` instead of `/teams/`)
   - Fixed: Removed trailing slashes to match Astro routing

2. **Data Differences Between Dev and Production**
   - Production might be using a different database than development
   - DATABASE_URL in production might point to localhost or wrong database
   - Fixed: Added database connection logging to identify the source

## Fixes Applied

### 1. Fixed Header Navigation URLs

**File: `src/features/layout/components/Header.astro`**
- Changed `/teams/` → `/teams`
- Changed `/standings/` → `/standings`
- Changed `/upcoming-fixtures/` → `/upcoming-fixtures`
- Changed `/about-club/` → `/about-club`
- Changed `/contacts/` → `/contacts`
- Changed `/league-registration/` → `/league-registration`

**File: `src/features/layout/components/MobileMenu.tsx`**
- Fixed `/players/` → `/teams` (was pointing to wrong page)
- Removed all trailing slashes to match desktop header

### 2. Added Database Connection Logging

**File: `src/lib/prisma.ts`**
- Added logging to show which database is being connected to
- Shows database host and name (without sensitive credentials)
- Warns if production is using localhost database URL

## How to Verify the Fixes

### 1. Check Database Connection

After deploying, check Vercel function logs:

1. Go to Vercel Dashboard → Deployments → Select deployment → Functions → Logs
2. Look for lines like:
   ```
   [Database] Connecting to: your-db-host.com/your-db-name (PRODUCTION)
   ```

**If you see:**
```
[Database] WARNING: Production environment is using localhost database URL!
```
**This means your DATABASE_URL in Vercel is pointing to localhost - this is the cause of data differences!**

### 2. Verify Navigation Works

Test all header links in production:
- ✅ Home (`/`)
- ✅ Teams (`/teams`)
- ✅ Standings (`/standings`)
- ✅ Fixtures (`/upcoming-fixtures`)
- ✅ About (`/about-club`)
- ✅ Contacts (`/contacts`)
- ✅ League Registration (`/league-registration`)

### 3. Verify Data Source

**Check your DATABASE_URL in Vercel:**

1. Go to Vercel Dashboard → Settings → Environment Variables
2. Find `DATABASE_URL`
3. Verify it's pointing to your **production database**, not:
   - ❌ `localhost`
   - ❌ `127.0.0.1`
   - ❌ Your local development database

**The DATABASE_URL should be:**
- ✅ Your production Supabase/PostgreSQL connection string
- ✅ A cloud database (not localhost)

## Common Issues and Solutions

### Issue: Data is Different in Production

**Cause:** DATABASE_URL in Vercel is pointing to the wrong database (likely localhost or dev database)

**Solution:**
1. Check Vercel logs for database connection warnings
2. Verify DATABASE_URL in Vercel dashboard points to production database
3. Update DATABASE_URL if it's wrong
4. Redeploy after updating

### Issue: Header Links Redirect to Wrong Pages

**Cause:** Trailing slashes or incorrect URLs in header navigation

**Solution:**
- ✅ Already fixed in this update
- If still happening, clear browser cache and hard refresh (Ctrl+Shift+R)

### Issue: Some Pages Show 404

**Cause:** URL mismatch between header links and actual page routes

**Solution:**
- ✅ Already fixed - all header links now match actual page routes
- Verify pages exist: `/teams`, `/standings`, `/upcoming-fixtures`, etc.

## Database Connection Verification

To verify which database production is using:

1. **Check Vercel Logs:**
   ```
   [Database] Connecting to: <hostname>/<database> (PRODUCTION)
   ```

2. **Compare with your .env files:**
   - `.env` - Should point to localhost (development)
   - `.env.production` - Should point to production database
   - Vercel DATABASE_URL - Should match `.env.production`

3. **If they don't match:**
   - Update DATABASE_URL in Vercel dashboard
   - Redeploy the application
   - Check logs again to verify

## Testing Checklist

After deploying these fixes:

- [ ] All header navigation links work correctly
- [ ] Mobile menu links match desktop header
- [ ] No 404 errors on navigation
- [ ] Database connection logs show correct production database
- [ ] Data in production matches what you expect
- [ ] No warnings about localhost database in production logs

## Next Steps

1. **Deploy the fixes** to production
2. **Check Vercel logs** for database connection info
3. **Verify DATABASE_URL** in Vercel dashboard points to production database
4. **Test all navigation links** in production
5. **Compare data** - if still different, check database connection logs

## Files Modified

1. `src/features/layout/components/Header.astro` - Fixed navigation URLs
2. `src/features/layout/components/MobileMenu.tsx` - Fixed mobile navigation URLs
3. `src/lib/prisma.ts` - Added database connection logging

---

**Last Updated**: January 2025

