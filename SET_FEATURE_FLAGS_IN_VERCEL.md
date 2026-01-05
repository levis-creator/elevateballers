# How to Set Feature Flags in Vercel Production

## ⚠️ Important Note

The `.env.production` file is **NOT automatically used** in production. It's only for reference. You **MUST** set these variables in the Vercel Dashboard for them to work in production.

## Step-by-Step Instructions

### Step 1: Go to Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign in
2. Select your project
3. Click **Settings** → **Environment Variables**

### Step 2: Add Feature Flags

For each feature flag you want to enable, click **"Add New"** and enter:

**Variable Name:** `FEATURE_FLAG_LAYOUT_TOPBAR`  
**Value:** `true`  
**Environments:** ✅ Production (and Preview if needed)

### Step 3: Add All Homepage Features

Add these variables one by one (or use the bulk import method below):

#### Layout Features:
- `FEATURE_FLAG_LAYOUT_TOPBAR` = `true`
- `FEATURE_FLAG_LAYOUT_HEADER` = `true`
- `FEATURE_FLAG_LAYOUT_MOBILE_MENU` = `true`
- `FEATURE_FLAG_LAYOUT_FOOTER` = `true`

#### Homepage Features:
- `FEATURE_FLAG_HOME_POST_SLIDER` = `true`
- `FEATURE_FLAG_HOME_NEWS_TICKER` = `true`
- `FEATURE_FLAG_HOME_MARQUEE_MATCHUP` = `true`
- `FEATURE_FLAG_HOME_NEXT_MATCH_CAROUSEL` = `true`
- `FEATURE_FLAG_HOME_LATEST_NEWS` = `true`
- `FEATURE_FLAG_HOME_PLAYER_OF_THE_WEEK` = `true`
- `FEATURE_FLAG_HOME_STATS_LEADERS` = `true`
- `FEATURE_FLAG_HOME_STATS_SECTION` = `true`
- `FEATURE_FLAG_HOME_MEDIA_GALLERY` = `true`
- `FEATURE_FLAG_HOME_SPONSORS` = `true`
- `FEATURE_FLAG_HOME_REGISTRATION_CTA` = `true`

### Step 4: Redeploy

**CRITICAL:** After adding environment variables, you **MUST** redeploy:

1. Go to **Deployments** tab
2. Click **"..."** on your latest deployment
3. Select **"Redeploy"**
4. Or push a new commit to trigger deployment

## Quick Copy-Paste List

Copy these and add them one by one in Vercel:

```
FEATURE_FLAG_LAYOUT_TOPBAR=true
FEATURE_FLAG_LAYOUT_HEADER=true
FEATURE_FLAG_LAYOUT_MOBILE_MENU=true
FEATURE_FLAG_LAYOUT_FOOTER=true
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
```

## Alternative: Use JSON Format

Instead of individual variables, you can use a single JSON variable:

**Variable Name:** `FEATURE_FLAGS`  
**Value:**
```json
{
  "layout.topbar": true,
  "layout.header": true,
  "layout.mobileMenu": true,
  "layout.footer": true,
  "home.postSlider": true,
  "home.newsTicker": true,
  "home.marqueeMatchup": true,
  "home.nextMatchCarousel": true,
  "home.latestNews": true,
  "home.playerOfTheWeek": true,
  "home.statsLeaders": true,
  "home.statsSection": true,
  "home.mediaGallery": true,
  "home.sponsors": true,
  "home.registrationCta": true
}
```

## Verify Feature Flags Are Working

After redeploying, test in production:

1. Open your production site
2. Open browser console (F12)
3. Run:
   ```javascript
   fetch('/api/feature-flags')
     .then(r => r.json())
     .then(data => {
       console.log('Feature Flags:', data);
       console.log('Post Slider:', data['home.postSlider']);
       console.log('Latest News:', data['home.latestNews']);
     });
   ```

## Troubleshooting

### Features Still Not Showing?

1. **Did you redeploy?** - Environment variables only apply after redeployment
2. **Check variable names** - Must match exactly (case-sensitive)
3. **Check values** - Must be `true` (string), not boolean
4. **Check environment** - Must be set for "Production"
5. **Clear browser cache** - Hard refresh (Ctrl+Shift+R)

### Features Default to Enabled

If you **don't set** any feature flags, they all default to `true` (enabled). You only need to set them if you want to disable specific features.

## What Each Feature Does

- **home.postSlider** - Hero post slider carousel at top
- **home.newsTicker** - Scrolling news ticker
- **home.marqueeMatchup** - Featured match display
- **home.nextMatchCarousel** - Upcoming matches carousel
- **home.latestNews** - Latest news grid with categories
- **home.playerOfTheWeek** - Player of the week showcase
- **home.statsLeaders** - Stats leaders carousel
- **home.statsSection** - League statistics section
- **home.mediaGallery** - Media gallery section
- **home.sponsors** - Sponsors carousel
- **home.registrationCta** - Registration call-to-action

---

**Remember:** Set these in Vercel Dashboard, not just in `.env.production`!

