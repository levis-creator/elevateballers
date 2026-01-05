# Homepage Review Summary

## Homepage Structure

The homepage consists of **11 content sections** plus **4 layout components**, all controlled by feature flags.

## Sections Overview

| # | Section | Component | Feature Flag | Data Source | Type |
|---|---------|-----------|--------------|-------------|------|
| 1 | Post Slider | `PostSlider` | `home.postSlider` | `/api/news?featured=true` | React (client) |
| 2 | News Ticker | `NewsTicker` | `home.newsTicker` | `/api/news?limit=5` | React (client) |
| 3 | Marquee Matchup | `MarqueeMatchup` | `home.marqueeMatchup` | `/api/matches?status=UPCOMING` | Astro (server) |
| 4 | Next Match Carousel | `NextMatchCarousel` | `home.nextMatchCarousel` | `/api/matches?status=upcoming` | React (client) |
| 5 | Latest News | `LatestNews` | `home.latestNews` | `/api/news?limit=5&category=...` | React (client) |
| 6 | Player of the Week | `PlayerOfTheWeek` | `home.playerOfTheWeek` | Database/Static | Astro (server) |
| 7 | Stats Leaders | Inline HTML/JS | `home.statsLeaders` | Legacy SportsPress | Legacy |
| 8 | Statistics Section | `StatsSection` | `home.statsSection` | Database | Astro (server) |
| 9 | Media Gallery | `MediaGallery` | `home.mediaGallery` | `/api/media` | React (client) |
| 10 | Sponsors | `Sponsors` | `home.sponsors` | Static/Database | React (client) |
| 11 | Registration CTA | Inline HTML | `home.registrationCta` | Static | Static |

## Data Dependencies

### API Endpoints:
1. **`/api/news?featured=true`** - Featured articles (PostSlider)
2. **`/api/news?limit=5`** - Latest news (NewsTicker, LatestNews)
3. **`/api/news?limit=5&category=<category>`** - News by category (LatestNews)
4. **`/api/matches?status=UPCOMING`** - Upcoming matches (MarqueeMatchup, NextMatchCarousel)
5. **`/api/media`** - Media items (MediaGallery)

### Database Requirements:
- **News Articles:** Must have `published=true` (and `feature=true` for PostSlider)
- **Matches:** Must have upcoming matches with `status=UPCOMING`
- **Media:** Must have media items
- **Players/Stats:** Must have player and stats data

## Potential Differences

### 1. Feature Flags
- **Most Common:** Feature flags disabled in production
- **Check:** Vercel environment variables
- **Fix:** Enable flags in Vercel dashboard

### 2. Database Data
- **Common:** Production database has different/empty data
- **Check:** Database connection logs, API responses
- **Fix:** Verify `DATABASE_URL`, sync data

### 3. API Errors
- **Common:** API endpoints failing in production
- **Check:** Browser console, Vercel function logs
- **Fix:** Check API routes, database connection

### 4. Component Rendering
- **Common:** React components not hydrating
- **Check:** Browser console for errors
- **Fix:** Fix JavaScript errors, check dependencies

## Quick Diagnostic

**Run in production browser console:**
```javascript
// Copy from: node scripts/homepage-diagnostic.js
// Or use the full diagnostic script in HOMEPAGE_REVIEW.md
```

## Comparison Checklist

See `HOMEPAGE_COMPARISON_CHECKLIST.md` for detailed comparison steps.

## Files to Review

1. **`src/pages/index.astro`** - Main homepage file
2. **`src/lib/feature-flags.ts`** - Feature flag configuration
3. **`src/features/home/components/*`** - Homepage components
4. **`src/pages/api/news/index.ts`** - News API endpoint
5. **`src/pages/api/matches/index.ts`** - Matches API endpoint

## Next Steps

1. ✅ Run diagnostic script in production
2. ✅ Compare feature flags between dev and production
3. ✅ Compare API responses between dev and production
4. ✅ Check database connection in production
5. ✅ Verify all feature flags are enabled in Vercel
6. ✅ Fix any differences found

---

**All review documents:**
- `HOMEPAGE_REVIEW.md` - Detailed review
- `HOMEPAGE_COMPARISON_CHECKLIST.md` - Step-by-step comparison
- `HOMEPAGE_REVIEW_SUMMARY.md` - This file (quick reference)
- `scripts/homepage-diagnostic.js` - Browser diagnostic script

