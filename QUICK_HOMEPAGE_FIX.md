# Quick Fix: Homepage Differences

## The Problem
Homepage in production looks different from local development.

## Most Common Causes

### 1. **Feature Flags Disabled in Production** ⚠️ MOST COMMON

Feature flags control what sections show on the homepage. If they're disabled in Vercel, sections won't appear.

**Quick Check:**
1. Go to **Vercel Dashboard** → **Settings** → **Environment Variables**
2. Look for any `FEATURE_FLAG_*` variables
3. If any are set to `false`, that section is hidden

**Quick Fix:**
- Remove `FEATURE_FLAG_*` variables from Vercel (they default to enabled)
- OR set them all to `true`:
  ```
  FEATURE_FLAG_HOME_POST_SLIDER=true
  FEATURE_FLAG_HOME_NEWS_TICKER=true
  FEATURE_FLAG_HOME_LATEST_NEWS=true
  ... (all others)
  ```

### 2. **Different Database Data**

Production might be using a different database or the database might be empty.

**Quick Check:**
- Check Vercel logs for database connection
- Look for: `[Database] Connecting to: ...`
- Verify it's your production database

**Quick Fix:**
- Ensure `DATABASE_URL` in Vercel points to production database
- Verify production database has data

### 3. **API Errors**

Components fetch data from APIs. If APIs fail, sections won't show data.

**Quick Check:**
1. Open production site in browser
2. Press F12 → Console tab
3. Look for red errors
4. Press F12 → Network tab
5. Check if API calls are failing

**Quick Fix:**
- Check Vercel function logs for API errors
- Verify API routes are working

## Immediate Actions

### Step 1: Run Diagnostic
```bash
npm run check-homepage
```

### Step 2: Check Vercel Environment Variables
1. Vercel Dashboard → Settings → Environment Variables
2. Check for `FEATURE_FLAG_*` variables
3. Remove any that are set to `false` (or set to `true`)

### Step 3: Verify Database
1. Check Vercel logs for database connection
2. Verify `DATABASE_URL` is correct
3. Check if production database has data

### Step 4: Test in Browser
1. Open production site
2. Open DevTools (F12)
3. Check Console for errors
4. Check Network tab for failed requests

## Feature Flags That Control Homepage

**Homepage Sections:**
- `home.postSlider` - Hero slider
- `home.newsTicker` - News ticker
- `home.marqueeMatchup` - Featured match
- `home.nextMatchCarousel` - Upcoming matches
- `home.latestNews` - News grid
- `home.playerOfTheWeek` - Player showcase
- `home.statsLeaders` - Stats carousel
- `home.statsSection` - Statistics
- `home.mediaGallery` - Media gallery
- `home.sponsors` - Sponsors
- `home.registrationCta` - Registration CTA

**Layout:**
- `layout.topbar` - Top bar
- `layout.header` - Header
- `layout.mobileMenu` - Mobile menu
- `layout.footer` - Footer

## Quick Test

**In production browser console:**
```javascript
// Check feature flags
fetch('/api/feature-flags')
  .then(r => r.json())
  .then(data => {
    console.log('Feature Flags:', data);
    // Check if homepage flags are enabled
    console.log('Post Slider:', data['home.postSlider']);
    console.log('News Ticker:', data['home.newsTicker']);
    console.log('Latest News:', data['home.latestNews']);
  });
```

## Most Likely Fix

**90% of the time, it's feature flags:**

1. Go to Vercel Dashboard
2. Settings → Environment Variables
3. Remove ALL `FEATURE_FLAG_*` variables (or set to `true`)
4. Redeploy
5. Clear browser cache and test

---

See `HOMEPAGE_DIFFERENCES_FIX.md` for detailed troubleshooting.

