# Homepage Comparison Checklist: Dev vs Production

## Quick Diagnostic

**Run this in production browser console:**
```bash
# Generate the diagnostic script
node scripts/homepage-diagnostic.js
# Then copy the output and paste into production browser console
```

## Homepage Sections Checklist

### Layout Components
- [ ] **TopBar** - Visible in both dev and production?
- [ ] **Header** - Navigation working correctly?
- [ ] **MobileMenu** - Mobile menu functional?
- [ ] **Footer** - Footer visible?

### Content Sections

#### 1. Post Slider (Hero Section)
- **Feature Flag:** `home.postSlider`
- **API:** `/api/news?featured=true`
- **Requirements:** Articles with `feature=true` AND `published=true`
- [ ] Section visible in dev?
- [ ] Section visible in production?
- [ ] Shows articles in dev?
- [ ] Shows articles in production?
- [ ] Same number of articles?
- [ ] Same articles?

#### 2. News Ticker
- **Feature Flag:** `home.newsTicker`
- **API:** `/api/news?limit=5`
- **Requirements:** Published articles
- [ ] Section visible in dev?
- [ ] Section visible in production?
- [ ] Ticker scrolling in dev?
- [ ] Ticker scrolling in production?
- [ ] Shows articles in dev?
- [ ] Shows articles in production?

#### 3. Marquee Matchup
- **Feature Flag:** `home.marqueeMatchup`
- **API:** `/api/matches?status=UPCOMING&stage=CHAMPIONSHIP` (or any upcoming)
- **Requirements:** Upcoming match exists
- [ ] Section visible in dev?
- [ ] Section visible in production?
- [ ] Shows match in dev?
- [ ] Shows match in production?
- [ ] Same match displayed?

#### 4. Next Match Carousel
- **Feature Flag:** `home.nextMatchCarousel`
- **API:** `/api/matches?status=upcoming`
- **Requirements:** Upcoming matches exist
- [ ] Section visible in dev?
- [ ] Section visible in production?
- [ ] Carousel working in dev?
- [ ] Carousel working in production?
- [ ] Shows matches in dev?
- [ ] Shows matches in production?

#### 5. Latest News
- **Feature Flag:** `home.latestNews`
- **API:** `/api/news?limit=5&category=<category>`
- **Requirements:** Published articles
- [ ] Section visible in dev?
- [ ] Section visible in production?
- [ ] Category tabs working in dev?
- [ ] Category tabs working in production?
- [ ] Shows articles in dev?
- [ ] Shows articles in production?
- [ ] Same articles displayed?

#### 6. Player of the Week
- **Feature Flag:** `home.playerOfTheWeek`
- **Data Source:** Likely static or database
- [ ] Section visible in dev?
- [ ] Section visible in production?
- [ ] Shows player in dev?
- [ ] Shows player in production?

#### 7. Stats Leaders
- **Feature Flag:** `home.statsLeaders`
- **Data Source:** Legacy SportsPress system
- [ ] Section visible in dev?
- [ ] Section visible in production?
- [ ] Carousel working in dev?
- [ ] Carousel working in production?
- [ ] Shows stats in dev?
- [ ] Shows stats in production?

#### 8. Statistics Section
- **Feature Flag:** `home.statsSection`
- **Data Source:** Database
- [ ] Section visible in dev?
- [ ] Section visible in production?
- [ ] Shows stats in dev?
- [ ] Shows stats in production?

#### 9. Media Gallery
- **Feature Flag:** `home.mediaGallery`
- **API:** `/api/media`
- **Requirements:** Media items exist
- [ ] Section visible in dev?
- [ ] Section visible in production?
- [ ] Gallery working in dev?
- [ ] Gallery working in production?
- [ ] Shows media in dev?
- [ ] Shows media in production?

#### 10. Sponsors
- **Feature Flag:** `home.sponsors`
- **Data Source:** Static or database
- [ ] Section visible in dev?
- [ ] Section visible in production?
- [ ] Shows sponsors in dev?
- [ ] Shows sponsors in production?

#### 11. Registration CTA
- **Feature Flag:** `home.registrationCta`
- **Links:** Hardcoded to `http://elevateballers.com/registration-test`
- [ ] Section visible in dev?
- [ ] Section visible in production?
- [ ] Links working correctly?

## API Endpoints Comparison

### Test in Browser Console (Both Environments)

```javascript
// 1. Featured News
fetch('/api/news?featured=true')
  .then(r => r.json())
  .then(data => {
    console.log('Featured News:', data.length, 'articles');
    console.log('Articles:', data.map(a => a.title));
  });

// 2. Latest News
fetch('/api/news?limit=5')
  .then(r => r.json())
  .then(data => {
    console.log('Latest News:', data.length, 'articles');
    console.log('Articles:', data.map(a => a.title));
  });

// 3. Upcoming Matches
fetch('/api/matches?status=upcoming')
  .then(r => r.json())
  .then(data => {
    console.log('Upcoming Matches:', data.length, 'matches');
  });

// 4. Media
fetch('/api/media')
  .then(r => r.json())
  .then(data => {
    console.log('Media Items:', data.length, 'items');
  });
```

**Compare:**
- [ ] Same number of featured articles?
- [ ] Same featured articles?
- [ ] Same number of latest articles?
- [ ] Same latest articles?
- [ ] Same number of upcoming matches?
- [ ] Same matches?
- [ ] Same number of media items?

## Feature Flags Comparison

### Check Feature Flags

**In browser console (both environments):**
```javascript
fetch('/api/feature-flags')
  .then(r => r.json())
  .then(data => {
    const homepageFlags = {
      'home.postSlider': data['home.postSlider'],
      'home.newsTicker': data['home.newsTicker'],
      'home.marqueeMatchup': data['home.marqueeMatchup'],
      'home.nextMatchCarousel': data['home.nextMatchCarousel'],
      'home.latestNews': data['home.latestNews'],
      'home.playerOfTheWeek': data['home.playerOfTheWeek'],
      'home.statsLeaders': data['home.statsLeaders'],
      'home.statsSection': data['home.statsSection'],
      'home.mediaGallery': data['home.mediaGallery'],
      'home.sponsors': data['home.sponsors'],
      'home.registrationCta': data['home.registrationCta'],
    };
    console.table(homepageFlags);
  });
```

**Compare:**
- [ ] All flags enabled in dev?
- [ ] All flags enabled in production?
- [ ] Any flags different between environments?

## Common Issues & Fixes

### Issue: Section Missing Entirely
**Check:**
1. Feature flag enabled? (Run feature flags check above)
2. Component rendering? (Check DOM)
3. JavaScript errors? (Check console)

**Fix:**
- Enable feature flag in Vercel
- Check for JavaScript errors
- Verify component is in code

### Issue: Section Visible But Empty
**Check:**
1. API returning data? (Run API checks above)
2. Database has data?
3. API errors? (Check console)

**Fix:**
- Verify database has data
- Check API endpoint is working
- Check database connection

### Issue: Different Content
**Check:**
1. Same database? (Check connection logs)
2. Same API responses? (Compare API calls)
3. Different data in database?

**Fix:**
- Verify `DATABASE_URL` in Vercel
- Ensure production database has same data
- Check if data needs to be synced

### Issue: Components Not Loading
**Check:**
1. JavaScript errors? (Check console)
2. Dependencies loaded? (Check network tab)
3. React hydration errors?

**Fix:**
- Fix JavaScript errors
- Check all dependencies are loaded
- Verify React components are working

## Quick Comparison Script

**Run this in both dev and production, then compare results:**

```javascript
(async () => {
  const results = {
    url: window.location.href,
    timestamp: new Date().toISOString(),
    featureFlags: {},
    apiData: {},
    components: {}
  };
  
  // Feature flags
  try {
    const flags = await fetch('/api/feature-flags').then(r => r.json());
    results.featureFlags = {
      postSlider: flags['home.postSlider'],
      newsTicker: flags['home.newsTicker'],
      latestNews: flags['home.latestNews'],
      nextMatch: flags['home.nextMatchCarousel'],
      mediaGallery: flags['home.mediaGallery'],
    };
  } catch (e) {
    results.featureFlags = { error: e.message };
  }
  
  // API data
  const apis = [
    { name: 'featured', url: '/api/news?featured=true' },
    { name: 'latest', url: '/api/news?limit=5' },
    { name: 'matches', url: '/api/matches?status=upcoming' },
  ];
  
  for (const api of apis) {
    try {
      const data = await fetch(api.url).then(r => r.json());
      results.apiData[api.name] = {
        count: Array.isArray(data) ? data.length : 'N/A',
        sample: Array.isArray(data) && data.length > 0 ? data[0].title || data[0].id : 'N/A'
      };
    } catch (e) {
      results.apiData[api.name] = { error: e.message };
    }
  }
  
  // Components
  results.components = {
    postSlider: document.querySelectorAll('[class*="post-slider"]').length,
    newsTicker: document.querySelectorAll('[class*="news-ticker"]').length,
    latestNews: document.querySelectorAll('[class*="latest-news"]').length,
    nextMatch: document.querySelectorAll('[class*="next-match"]').length,
  };
  
  console.log('=== HOMEPAGE COMPARISON DATA ===');
  console.log(JSON.stringify(results, null, 2));
  console.log('\\nCopy this data and compare with the other environment!');
  
  return results;
})();
```

## Summary

After running all checks, document:

1. **Which sections are different?**
   - List sections that differ

2. **What's the difference?**
   - Missing sections?
   - Empty sections?
   - Different content?

3. **Root cause?**
   - Feature flags?
   - Database data?
   - API errors?
   - JavaScript errors?

4. **Fix applied?**
   - What was changed
   - Result after fix

---

**Use the diagnostic script in `scripts/homepage-diagnostic.js` for automated checking!**

