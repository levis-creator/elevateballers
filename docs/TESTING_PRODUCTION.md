# How to Test Production

## Methods to Test Production

### Method 1: Test Local Build with Production Environment (Recommended)

This lets you test production build locally before deploying.

#### Step 1: Set Production Environment Variables Locally

**Option A: Copy from .env.production**
```bash
# Copy production env to local (temporarily)
cp .env.production .env
```

**Option B: Use Vercel CLI to pull environment variables**
```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Login to Vercel
vercel login

# Pull environment variables from production
vercel env pull .env.production
```

#### Step 2: Build and Preview Locally

**⚠️ Important:** The Vercel adapter doesn't support `astro preview`. Use one of these methods:

**Option A: Use Vercel CLI (Recommended)**
```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Login to Vercel
vercel login

# Build first
npm run build:clean

# Pull production environment variables first
vercel env pull .env.production

# Then preview with Vercel CLI
npm run preview:vercel
# or: vercel dev
```

This will start a local server using production environment variables from Vercel.

**Option B: Test actual production deployment**
```bash
# Just deploy and test on production URL
git push
# Then test at your production URL
```

**Option C: Use Node adapter for local preview (if needed)**
If you need to test the build output directly, you can temporarily switch adapters, but this is not recommended.

#### Step 3: Test the Build

1. Open `http://localhost:4321` in browser
2. Test all features:
   - Homepage sections
   - Navigation
   - API endpoints
   - Admin portal
   - Forms and interactions

### Method 2: Test Actual Production Deployment

#### Step 1: Access Production URL

1. Go to your Vercel dashboard
2. Find your production URL (e.g., `your-app.vercel.app`)
3. Open it in a browser

#### Step 2: Run Diagnostic Scripts

**In browser console (F12 → Console):**

```javascript
// Quick feature flags check
fetch('/api/feature-flags')
  .then(r => r.json())
  .then(data => {
    console.table({
      'Post Slider': data['home.postSlider'],
      'News Ticker': data['home.newsTicker'],
      'Latest News': data['home.latestNews'],
      'Header': data['layout.header'],
      'Footer': data['layout.footer'],
    });
  });

// Check API endpoints
Promise.all([
  fetch('/api/news?featured=true').then(r => r.json()),
  fetch('/api/news?limit=5').then(r => r.json()),
  fetch('/api/matches?status=upcoming').then(r => r.json()),
]).then(([featured, latest, matches]) => {
  console.log('API Results:', {
    featured: featured.length,
    latest: latest.length,
    matches: matches.length,
  });
});
```

#### Step 3: Use Full Diagnostic Script

```bash
# Generate diagnostic script
node scripts/homepage-diagnostic.js

# Copy the output and paste into production browser console
```

### Method 3: Use Vercel CLI to Test Production Locally

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Run production environment locally
vercel dev --prod
```

This runs your app locally but uses production environment variables from Vercel.

### Method 4: Compare Dev vs Production Side-by-Side

1. **Open two browser windows:**
   - Window 1: `http://localhost:4321` (local dev: `npm run dev`)
   - Window 2: `https://your-production-url.vercel.app`

2. **Compare visually:**
   - Same sections visible?
   - Same content?
   - Same styling?

3. **Compare data:**
   - Run API checks in both
   - Compare responses

## Testing Checklist

### Homepage Testing

- [ ] All sections visible
- [ ] Post slider shows articles
- [ ] News ticker scrolling
- [ ] Latest news grid populated
- [ ] Matches carousel working
- [ ] Media gallery populated
- [ ] Navigation links work
- [ ] No console errors
- [ ] No 404 errors

### API Testing

Test each endpoint:
- [ ] `/api/news?featured=true` - Returns featured articles
- [ ] `/api/news?limit=5` - Returns latest articles
- [ ] `/api/matches?status=upcoming` - Returns upcoming matches
- [ ] `/api/media` - Returns media items
- [ ] `/api/teams` - Returns teams
- [ ] `/api/feature-flags` - Returns feature flags

### Admin Portal Testing

- [ ] Can access `/admin/login`
- [ ] Can log in with admin credentials
- [ ] Dashboard loads
- [ ] Can navigate admin sections
- [ ] Can create/edit content
- [ ] Can view content

### Navigation Testing

- [ ] Header links work
- [ ] Mobile menu works
- [ ] Footer links work
- [ ] All pages accessible
- [ ] No broken links

## Automated Testing Scripts

### Quick Production Test

```bash
# Test production build locally
npm run build:clean
npm run preview

# Then open http://localhost:4321 and test manually
```

### API Endpoint Test

Create a test script to check all APIs:

```bash
# Test all API endpoints
node scripts/test-apis.js
```

## Browser Testing Tools

### Chrome DevTools

1. **Network Tab:**
   - Check API calls
   - Verify responses
   - Check for failed requests

2. **Console Tab:**
   - Check for errors
   - Run diagnostic scripts
   - Test feature flags

3. **Application Tab:**
   - Check cookies
   - Check localStorage
   - Check service workers

### Compare Network Requests

1. Open DevTools → Network tab
2. Reload page
3. Filter by "Fetch/XHR"
4. Compare API responses between dev and production

## Common Testing Scenarios

### Scenario 1: Test Feature Flags

```javascript
// In production browser console
fetch('/api/feature-flags')
  .then(r => r.json())
  .then(flags => {
    const homepageFlags = Object.keys(flags)
      .filter(k => k.startsWith('home.'))
      .reduce((acc, k) => ({ ...acc, [k]: flags[k] }), {});
    console.table(homepageFlags);
  });
```

### Scenario 2: Test API Endpoints

```javascript
// Test all homepage APIs
const apis = [
  '/api/news?featured=true',
  '/api/news?limit=5',
  '/api/matches?status=upcoming',
  '/api/media',
];

Promise.all(apis.map(url => 
  fetch(url)
    .then(r => ({ url, status: r.status, ok: r.ok }))
    .catch(e => ({ url, error: e.message }))
)).then(console.table);
```

### Scenario 3: Test Component Rendering

```javascript
// Check if components are in DOM
const components = {
  'Post Slider': document.querySelectorAll('[class*="post-slider"]').length,
  'News Ticker': document.querySelectorAll('[class*="news-ticker"]').length,
  'Latest News': document.querySelectorAll('[class*="latest-news"]').length,
  'Next Match': document.querySelectorAll('[class*="next-match"]').length,
  'Media Gallery': document.querySelectorAll('[class*="media-gallery"]').length,
};
console.table(components);
```

## Vercel-Specific Testing

### Test Production Deployment

1. **Go to Vercel Dashboard:**
   - Deployments → Latest deployment
   - Click "Visit" to open production URL

2. **Check Build Logs:**
   - Deployments → Latest → Build Logs
   - Look for errors or warnings

3. **Check Function Logs:**
   - Deployments → Latest → Functions → Logs
   - Check for runtime errors

4. **Check Analytics:**
   - Analytics tab (if enabled)
   - Check for errors or issues

### Test Preview Deployments

1. **Create a branch:**
   ```bash
   git checkout -b test-production
   git push
   ```

2. **Vercel creates preview deployment:**
   - Test on preview URL
   - Compare with production

## Quick Test Commands

```bash
# 1. Build and test locally
npm run build:clean
npm run preview

# 2. Test with production env vars
vercel dev --prod

# 3. Check build
npm run check-build

# 4. Check homepage config
npm run check-homepage
```

## Testing Checklist Summary

### Before Deploying to Production:
- [ ] Local build works (`npm run build`)
- [ ] Preview works (`npm run preview`)
- [ ] All tests pass (if you have tests)
- [ ] No console errors
- [ ] All features working locally

### After Deploying to Production:
- [ ] Production URL loads
- [ ] All sections visible
- [ ] API endpoints working
- [ ] Navigation works
- [ ] Admin portal accessible
- [ ] No console errors
- [ ] Database connection working

## Troubleshooting Production Issues

### Issue: Can't Access Production

**Check:**
1. Deployment status in Vercel
2. Build logs for errors
3. Domain configuration

### Issue: Features Not Working

**Check:**
1. Feature flags in Vercel
2. Environment variables set
3. Redeployed after changes

### Issue: API Errors

**Check:**
1. Vercel function logs
2. Database connection
3. API route deployment

## Best Practices

1. **Always test locally first:**
   ```bash
   npm run build:clean
   npm run preview
   ```

2. **Use preview deployments:**
   - Test on preview URL before merging to main

3. **Check logs regularly:**
   - Vercel function logs
   - Browser console
   - Network tab

4. **Compare environments:**
   - Use diagnostic scripts
   - Compare API responses
   - Compare feature flags

---

**Quick Start:**
1. `npm run build:clean && npm run preview` - Test production build locally
2. Open production URL and run diagnostic script
3. Compare results with local dev

