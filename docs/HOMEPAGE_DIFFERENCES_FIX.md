# Homepage Differences Between Dev and Production - Fix Guide

## Problem
The homepage looks different in production compared to local development.

## Root Causes

### 1. **Feature Flags Not Set in Production** (Most Common)

The homepage uses feature flags to show/hide sections. If feature flags aren't set in Vercel, they default to enabled, but environment variables might override them.

**Homepage sections controlled by feature flags:**
- `home.postSlider` - Hero post slider
- `home.newsTicker` - News ticker
- `home.marqueeMatchup` - Featured match
- `home.nextMatchCarousel` - Upcoming matches
- `home.latestNews` - Latest news grid
- `home.playerOfTheWeek` - Player of the week
- `home.statsLeaders` - Stats leaders
- `home.statsSection` - Statistics section
- `home.mediaGallery` - Media gallery
- `home.sponsors` - Sponsors
- `home.registrationCta` - Registration CTA

**Layout features:**
- `layout.topbar` - Top bar
- `layout.header` - Header
- `layout.mobileMenu` - Mobile menu
- `layout.footer` - Footer

### 2. **Different Database Data**

Components fetch data from the database. If production uses a different database, the data will be different.

**Components that fetch data:**
- `PostSlider` - Fetches featured news articles
- `NewsTicker` - Fetches latest news
- `LatestNews` - Fetches news articles
- `NextMatchCarousel` - Fetches upcoming matches
- `MarqueeMatchup` - Fetches featured match

### 3. **Environment Variables Affecting Behavior**

Some components might behave differently based on `NODE_ENV` or other environment variables.

## Solutions

### Solution 1: Check Feature Flags in Production

**In Vercel Dashboard:**
1. Go to **Settings** → **Environment Variables**
2. Check if any `FEATURE_FLAG_*` variables are set
3. If they are, they might be disabling features

**To enable all features in production:**
- Don't set any `FEATURE_FLAG_*` variables (they default to enabled)
- OR explicitly set them all to `true`:
  ```
  FEATURE_FLAG_HOME_POST_SLIDER=true
  FEATURE_FLAG_HOME_NEWS_TICKER=true
  FEATURE_FLAG_HOME_MARQUEE_MATCHUP=true
  FEATURE_FLAG_HOME_NEXT_MATCH_CAROUSEL=true
  FEATURE_FLAG_HOME_LATEST_NEWS=true
  FEATURE_FLAG_HOME_PLAYER_OF_THE_WEEK=true
  FEATURE_FLAG_HOME_STATS_LEADERS=true
  FEATURE_FLAG_HOME_STATS_SECTION=true
  FEATURE_FLAG_HOME_MEDIA_GALLERY=true
  FEATURE_FLAG_HOME_SPONSORS=true
  FEATURE_FLAG_HOME_REGISTRATION_CTA=true
  FEATURE_FLAG_LAYOUT_TOPBAR=true
  FEATURE_FLAG_LAYOUT_HEADER=true
  FEATURE_FLAG_LAYOUT_MOBILE_MENU=true
  FEATURE_FLAG_LAYOUT_FOOTER=true
  ```

### Solution 2: Verify Database Connection

**Check which database production is using:**
1. Check Vercel function logs for database connection info
2. Look for: `[Database] Connecting to: <hostname>/<database> (PRODUCTION)`
3. Verify it's your production database, not localhost

**If using wrong database:**
- Update `DATABASE_URL` in Vercel dashboard
- Redeploy

### Solution 3: Check Component Data Fetching

**Components fetch data from APIs:**
- `/api/news?featured=true` - Featured articles for PostSlider
- `/api/news?limit=5` - Latest news for NewsTicker and LatestNews
- `/api/matches?status=upcoming` - Upcoming matches

**If data is different:**
- Check if production database has the same data
- Check if API endpoints are working in production
- Check browser console for API errors

## Diagnostic Steps

### Step 1: Check Feature Flags

**In browser console (production):**
```javascript
// Check if feature flags are working
fetch('/api/feature-flags')
  .then(r => r.json())
  .then(console.log)
```

**Or check Vercel logs:**
- Look for feature flag evaluation
- Check if flags are being read from environment

### Step 2: Compare Data

**Check what data components are receiving:**

1. **Open browser DevTools** in production
2. **Network tab** - Check API calls:
   - `/api/news?featured=true`
   - `/api/news?limit=5`
   - `/api/matches?status=upcoming`
3. **Compare** with local dev network tab

### Step 3: Check Component Rendering

**In browser console (production):**
```javascript
// Check if components are rendering
document.querySelectorAll('[class*="post-slider"]').length
document.querySelectorAll('[class*="news-ticker"]').length
document.querySelectorAll('[class*="latest-news"]').length
```

## Quick Fix Checklist

- [ ] Check Vercel environment variables for `FEATURE_FLAG_*`
- [ ] Verify `DATABASE_URL` points to production database
- [ ] Check Vercel function logs for database connection
- [ ] Compare API responses in dev vs production
- [ ] Check browser console for errors in production
- [ ] Verify all feature flags are enabled (or not set)
- [ ] Clear Vercel build cache and redeploy
- [ ] Hard refresh browser (Ctrl+Shift+R)

## Most Likely Issues

### Issue 1: Feature Flags Disabled
**Symptom:** Sections missing on homepage
**Solution:** Check `FEATURE_FLAG_*` variables in Vercel, ensure they're `true` or not set

### Issue 2: No Data in Database
**Symptom:** Sections show but are empty
**Solution:** 
- Check if production database has data
- Verify API endpoints return data
- Check database connection logs

### Issue 3: API Errors
**Symptom:** Components don't load
**Solution:**
- Check browser console for errors
- Check Vercel function logs
- Verify API routes are deployed

## Verification

After fixing:

1. **Check homepage in production:**
   - All sections should be visible
   - Data should load correctly
   - No console errors

2. **Compare with local:**
   - Same sections visible
   - Same data structure
   - Same behavior

3. **Check feature flags:**
   ```bash
   # In production, check feature flags API
   curl https://your-domain.com/api/feature-flags
   ```

## Still Not Working?

1. **Check Vercel build logs** - See what's being built
2. **Check Vercel function logs** - See runtime errors
3. **Check browser console** - See client-side errors
4. **Compare network requests** - See API differences
5. **Check database logs** - See if queries are working

---

**Remember:** Feature flags default to `true` if not set. If sections are missing, check if they're explicitly disabled in Vercel environment variables.

