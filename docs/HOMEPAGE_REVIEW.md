# Homepage Review: Dev vs Production

## Homepage Structure Overview

The homepage (`src/pages/index.astro`) consists of multiple sections controlled by feature flags and populated with data from APIs.

## Homepage Sections (In Order)

### 1. **Layout Components** (Top to Bottom)
- ✅ **TopBar** - Controlled by `layout.topbar` feature flag
- ✅ **Header** - Controlled by `layout.header` feature flag  
- ✅ **MobileMenu** - Controlled by `layout.mobileMenu` feature flag
- ✅ **Footer** - Controlled by `layout.footer` feature flag

### 2. **Homepage Content Sections**

#### Section 1: Post Slider (Hero)
- **Component:** `PostSlider` (React, client-side)
- **Feature Flag:** `home.postSlider`
- **Data Source:** `/api/news?featured=true`
- **Requirements:** Articles with `feature=true` AND `published=true`
- **Displays:** Up to 5 featured articles in a carousel
- **Potential Issues:**
  - No featured articles in production database
  - API returning different data
  - Feature flag disabled

#### Section 2: News Ticker
- **Component:** `NewsTicker` (React, client-side)
- **Feature Flag:** `home.newsTicker`
- **Data Source:** `/api/news?limit=5`
- **Requirements:** Published articles
- **Displays:** 5 latest articles in scrolling ticker
- **Potential Issues:**
  - No articles in production database
  - API errors
  - Feature flag disabled

#### Section 3: Marquee Matchup
- **Component:** `MarqueeMatchup` (Astro, server-side)
- **Feature Flag:** `home.marqueeMatchup`
- **Data Source:** Likely fetches featured match
- **Potential Issues:**
  - No featured match in database
  - Feature flag disabled

#### Section 4: Next Match Carousel
- **Component:** `NextMatchCarousel` (React, client-side)
- **Feature Flag:** `home.nextMatchCarousel`
- **Data Source:** Likely `/api/matches?status=upcoming`
- **Displays:** Upcoming matches carousel
- **Potential Issues:**
  - No upcoming matches in production database
  - API errors
  - Feature flag disabled

#### Section 5: Latest News
- **Component:** `LatestNews` (React, client-side)
- **Feature Flag:** `home.latestNews`
- **Data Source:** `/api/news?limit=5&category=<category>`
- **Displays:** News grid with category tabs (All, Interviews, Championships, Match report, Analysis)
- **Requirements:** Published articles
- **Potential Issues:**
  - Different articles in production database
  - Category filtering not working
  - Feature flag disabled

#### Section 6: Player of the Week
- **Component:** `PlayerOfTheWeek` (Astro, server-side)
- **Feature Flag:** `home.playerOfTheWeek`
- **Data Source:** Likely from database or static
- **Potential Issues:**
  - No player data
  - Feature flag disabled

#### Section 7: Stats Leaders
- **Component:** Inline HTML/JS (Legacy)
- **Feature Flag:** `home.statsLeaders`
- **Data Source:** Legacy SportsPress system
- **Displays:** Stats leaders carousel
- **Potential Issues:**
  - Legacy system not working in production
  - jQuery/owl-carousel not loading
  - Feature flag disabled

#### Section 8: Statistics Section
- **Component:** `StatsSection` (Astro, server-side)
- **Feature Flag:** `home.statsSection`
- **Data Source:** Likely from database
- **Potential Issues:**
  - No stats data
  - Feature flag disabled

#### Section 9: Media Gallery
- **Component:** `MediaGallery` (React, client-side)
- **Feature Flag:** `home.mediaGallery`
- **Data Source:** `/api/media`
- **Potential Issues:**
  - No media items in production
  - API errors
  - Feature flag disabled

#### Section 10: Sponsors
- **Component:** `Sponsors` (React, client-side)
- **Feature Flag:** `home.sponsors`
- **Data Source:** Likely static or from database
- **Potential Issues:**
  - No sponsor data
  - Feature flag disabled

#### Section 11: Registration CTA
- **Component:** Inline HTML
- **Feature Flag:** `home.registrationCta`
- **Links to:** `http://elevateballers.com/registration-test` (hardcoded)
- **Potential Issues:**
  - Hardcoded URLs might differ
  - Feature flag disabled

## Data Dependencies

### API Endpoints Used:
1. `/api/news?featured=true` - Featured articles for PostSlider
2. `/api/news?limit=5` - Latest news for NewsTicker
3. `/api/news?limit=5&category=<category>` - Latest news by category
4. `/api/matches?status=upcoming` - Upcoming matches (likely)
5. `/api/media` - Media gallery items

### Database Requirements:
- **News Articles:** Must have `published=true` and optionally `feature=true`
- **Matches:** Must have upcoming matches
- **Media:** Must have media items
- **Players/Stats:** Must have player and stats data

## Comparison Checklist

### Visual Comparison

**In Local Dev:**
- [ ] All sections visible?
- [ ] Post slider shows articles?
- [ ] News ticker scrolling?
- [ ] Latest news grid populated?
- [ ] Matches carousel showing?
- [ ] Media gallery populated?
- [ ] Sponsors showing?

**In Production:**
- [ ] All sections visible?
- [ ] Post slider shows articles?
- [ ] News ticker scrolling?
- [ ] Latest news grid populated?
- [ ] Matches carousel showing?
- [ ] Media gallery populated?
- [ ] Sponsors showing?

### Feature Flags Check

**Run in browser console (both dev and production):**
```javascript
fetch('/api/feature-flags')
  .then(r => r.json())
  .then(data => {
    console.table({
      'Post Slider': data['home.postSlider'],
      'News Ticker': data['home.newsTicker'],
      'Latest News': data['home.latestNews'],
      'Next Match': data['home.nextMatchCarousel'],
      'Media Gallery': data['home.mediaGallery'],
      'TopBar': data['layout.topbar'],
      'Header': data['layout.header'],
      'Footer': data['layout.footer'],
    });
  });
```

### API Data Comparison

**Check API responses in both environments:**

1. **Featured Articles:**
   ```javascript
   fetch('/api/news?featured=true').then(r => r.json()).then(console.log)
   ```

2. **Latest News:**
   ```javascript
   fetch('/api/news?limit=5').then(r => r.json()).then(console.log)
   ```

3. **Upcoming Matches:**
   ```javascript
   fetch('/api/matches?status=upcoming').then(r => r.json()).then(console.log)
   ```

4. **Media:**
   ```javascript
   fetch('/api/media').then(r => r.json()).then(console.log)
   ```

### Component Rendering Check

**In browser console (production):**
```javascript
// Check if components rendered
const checks = {
  'Post Slider': document.querySelectorAll('[class*="post-slider"], [class*="PostSlider"]').length,
  'News Ticker': document.querySelectorAll('[class*="news-ticker"], [class*="NewsTicker"]').length,
  'Latest News': document.querySelectorAll('[class*="latest-news"], [class*="LatestNews"]').length,
  'Next Match': document.querySelectorAll('[class*="next-match"], [class*="NextMatch"]').length,
  'Media Gallery': document.querySelectorAll('[class*="media-gallery"], [class*="MediaGallery"]').length,
};
console.table(checks);
```

## Common Differences

### 1. **Missing Sections**
**Cause:** Feature flags disabled in production
**Check:** Vercel environment variables
**Fix:** Enable feature flags in Vercel dashboard

### 2. **Empty Sections**
**Cause:** No data in production database
**Check:** Database connection and data
**Fix:** Ensure production database has data

### 3. **Different Content**
**Cause:** Different database (production vs dev)
**Check:** Database connection logs
**Fix:** Verify `DATABASE_URL` points to correct database

### 4. **API Errors**
**Cause:** API endpoints failing in production
**Check:** Browser console and Vercel function logs
**Fix:** Check API route deployment and database connection

### 5. **JavaScript Errors**
**Cause:** Client-side errors preventing rendering
**Check:** Browser console for errors
**Fix:** Fix JavaScript errors, check dependencies

## Diagnostic Script

Run this in production browser console:

```javascript
// Complete homepage diagnostic
async function diagnoseHomepage() {
  const results = {
    featureFlags: {},
    apiResponses: {},
    components: {},
    errors: []
  };
  
  // Check feature flags
  try {
    const flags = await fetch('/api/feature-flags').then(r => r.json());
    results.featureFlags = {
      'home.postSlider': flags['home.postSlider'],
      'home.newsTicker': flags['home.newsTicker'],
      'home.latestNews': flags['home.latestNews'],
      'home.nextMatchCarousel': flags['home.nextMatchCarousel'],
      'home.mediaGallery': flags['home.mediaGallery'],
    };
  } catch (e) {
    results.errors.push('Feature flags API failed: ' + e.message);
  }
  
  // Check API responses
  const apis = [
    { name: 'Featured News', url: '/api/news?featured=true' },
    { name: 'Latest News', url: '/api/news?limit=5' },
    { name: 'Upcoming Matches', url: '/api/matches?status=upcoming' },
    { name: 'Media', url: '/api/media' },
  ];
  
  for (const api of apis) {
    try {
      const response = await fetch(api.url);
      const data = await response.json();
      results.apiResponses[api.name] = {
        status: response.status,
        count: Array.isArray(data) ? data.length : 'N/A',
        ok: response.ok
      };
    } catch (e) {
      results.apiResponses[api.name] = { error: e.message };
      results.errors.push(`${api.name} API failed: ${e.message}`);
    }
  }
  
  // Check component rendering
  results.components = {
    'Post Slider': document.querySelectorAll('[class*="post-slider"]').length,
    'News Ticker': document.querySelectorAll('[class*="news-ticker"]').length,
    'Latest News': document.querySelectorAll('[class*="latest-news"]').length,
    'Next Match': document.querySelectorAll('[class*="next-match"]').length,
    'Media Gallery': document.querySelectorAll('[class*="media-gallery"]').length,
  };
  
  console.log('=== HOMEPAGE DIAGNOSTIC RESULTS ===');
  console.table(results.featureFlags);
  console.table(results.apiResponses);
  console.table(results.components);
  if (results.errors.length > 0) {
    console.error('Errors:', results.errors);
  }
  
  return results;
}

// Run it
diagnoseHomepage();
```

## Step-by-Step Review Process

### Step 1: Visual Inspection
1. Open homepage in local dev
2. Take screenshots of all sections
3. Open homepage in production
4. Compare screenshots side-by-side
5. Note any missing or different sections

### Step 2: Feature Flags Check
1. Run feature flags API in both environments
2. Compare results
3. Note any differences

### Step 3: API Data Check
1. Check each API endpoint in both environments
2. Compare response data
3. Note any differences in:
   - Number of items
   - Content
   - Structure

### Step 4: Component Rendering
1. Check if components are rendering in DOM
2. Check for JavaScript errors
3. Check for missing dependencies

### Step 5: Database Verification
1. Check database connection logs
2. Verify which database is being used
3. Compare data between databases

## Expected Behavior

### All Sections Should:
- ✅ Be visible (unless feature flag disabled)
- ✅ Load data from APIs
- ✅ Handle errors gracefully
- ✅ Show loading states
- ✅ Work the same in dev and production

### If Sections Are Missing:
1. Check feature flags first
2. Check API responses
3. Check database data
4. Check JavaScript errors

## Quick Fix Priority

1. **Feature Flags** - Most common cause
2. **Database Connection** - Second most common
3. **API Errors** - Check Vercel function logs
4. **JavaScript Errors** - Check browser console
5. **Data Differences** - Compare database contents

---

**Use the diagnostic script above in production to quickly identify issues!**

