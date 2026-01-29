# Quick Guide: Testing Production

## 🚀 Fastest Way to Test Production

### Option 1: Test Production Build Locally (Recommended)

**⚠️ Important:** 
- `npm run start:local` uses **Node adapter** (different from production!)
- Production uses **Vercel adapter**
- Use Vercel CLI to test with the same adapter as production

**Quick way (one command):**
```bash
npm run preview:production
# This builds with Vercel adapter + pulls production env vars + starts server
```

**Manual way:**
```bash
# 1. Install Vercel CLI (if not installed)
npm i -g vercel

# 2. Login to Vercel
vercel login

# 3. Build and preview
npm run build:clean
vercel env pull .env.production
npm run preview:vercel

# 4. Open the URL shown (usually http://localhost:3000)
# 5. Test everything!
```

**Alternative:** Test actual production deployment (see Option 2)

### Option 2: Test Actual Production URL

1. **Open production URL** in browser
2. **Open DevTools** (F12)
3. **Run diagnostic:**
   ```javascript
   // Paste this in console
   fetch('/api/feature-flags')
     .then(r => r.json())
     .then(data => console.table(data));
   ```

## 📋 Quick Test Checklist

### Homepage
- [ ] All sections visible?
- [ ] Post slider shows articles?
- [ ] News ticker scrolling?
- [ ] Latest news populated?
- [ ] No console errors?

### APIs
```bash
# Test all APIs
npm run test:apis
```

### Admin Portal
- [ ] Can access `/admin/login`?
- [ ] Can log in?
- [ ] Dashboard works?

## 🔍 Compare Dev vs Production

**Side-by-side:**
1. Open local dev: `http://localhost:4321` (after `npm run dev`)
2. Open production: `https://your-domain.vercel.app`
3. Compare visually and functionally

## 🛠️ Diagnostic Tools

### Browser Console Scripts

**Check feature flags:**
```javascript
fetch('/api/feature-flags').then(r => r.json()).then(console.table);
```

**Check API data:**
```javascript
Promise.all([
  fetch('/api/news?featured=true').then(r => r.json()),
  fetch('/api/news?limit=5').then(r => r.json()),
]).then(([featured, latest]) => {
  console.log('Featured:', featured.length);
  console.log('Latest:', latest.length);
});
```

**Full diagnostic:**
```bash
node scripts/homepage-diagnostic.js
# Copy output and paste in browser console
```

## 📝 Testing Commands

```bash
# Test production build locally (requires Vercel CLI)
npm run build:clean
npm run preview:prod-env

# Test APIs locally (after starting dev server)
npm run dev  # In another terminal
npm run test:apis

# Test APIs on production (update URL first)
npm run test:production

# Check build configuration
npm run check-build

# Check homepage configuration
npm run check-homepage
```

## ⚡ Quick Test Workflow

1. **Build locally:**
   ```bash
   npm run build:clean
   npm run preview
   ```

2. **Test in browser:**
   - Open `http://localhost:4321`
   - Test all features
   - Check console for errors

3. **Deploy to production:**
   ```bash
   git add .
   git commit -m "Changes"
   git push
   ```

4. **Test production:**
   - Open production URL
   - Run diagnostic scripts
   - Compare with local

## 🐛 Common Issues When Testing

### Issue: Can't connect to local preview
**Fix:** Make sure `npm run preview` is running

### Issue: APIs return errors
**Fix:** Check if database is accessible, verify `DATABASE_URL`

### Issue: Features missing
**Fix:** Check feature flags in Vercel dashboard

### Issue: Different data
**Fix:** Verify `DATABASE_URL` points to correct database

---

**See `TESTING_PRODUCTION.md` for detailed testing guide!**

