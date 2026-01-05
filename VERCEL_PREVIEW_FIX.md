# Fix: Vercel Adapter Preview Issue

## The Problem

When using `@astrojs/vercel` adapter, running `npm run preview` gives this error:

```
The @astrojs/vercel adapter does not support the preview command.
```

## Why This Happens

The Vercel adapter is designed for serverless deployment on Vercel, not for local preview. The standard Astro preview command doesn't work with it.

## Solutions

### Solution 1: Use Vercel CLI (Recommended)

This is the best way to test production locally with actual Vercel environment variables.

```bash
# 1. Install Vercel CLI globally
npm i -g vercel

# 2. Login to your Vercel account
vercel login

# 3. Build your project
npm run build:clean

# 4. Pull production environment variables
vercel env pull .env.production

# 5. Run preview (will use production env vars from .env.production)
npm run preview:vercel
# or directly: vercel dev
```

This will:
- Use production environment variables from Vercel
- Simulate the production environment
- Start a local server (usually at `http://localhost:3000`)

### Solution 2: Test Actual Production Deployment

Instead of previewing locally, just test the actual production URL:

1. **Deploy to production:**
   ```bash
   git add .
   git commit -m "Your changes"
   git push
   ```

2. **Wait for deployment** (check Vercel dashboard)

3. **Test production URL:**
   - Open your production URL in browser
   - Run diagnostic scripts in browser console
   - Compare with local dev

### Solution 3: Use Development Mode

For most testing, development mode is sufficient:

```bash
npm run dev
```

This runs at `http://localhost:4321` and is good for:
- Testing features
- Debugging
- Development workflow

**Note:** This uses local `.env` file, not production environment variables.

## Updated Commands

I've updated your `package.json` with these commands:

- `npm run preview` - Shows warning message
- `npm run preview:vercel` - Uses Vercel CLI (uses local .env or .env.production)
- `npm run preview:prod-env` - Pulls production env vars first, then runs vercel dev

## Quick Reference

### Test Production Locally:
```bash
# Option 1: Pull production env vars and preview
npm run preview:prod-env

# Option 2: Manual steps
vercel env pull .env.production
npm run preview:vercel
```

### Test Development:
```bash
npm run dev
```

### Test Actual Production:
1. Deploy: `git push`
2. Open production URL
3. Test in browser

## Why Not Use Standard Preview?

The Vercel adapter:
- Generates serverless functions
- Uses Vercel-specific routing
- Requires Vercel runtime environment

Standard Astro preview:
- Uses Node.js server
- Different routing mechanism
- Not compatible with Vercel adapter

## Best Practice

1. **Development:** Use `npm run dev` for daily development
2. **Pre-deployment:** Use `npm run preview:prod` to test with production env vars
3. **Production:** Test actual production deployment after pushing

## Troubleshooting

### Issue: `vercel: command not found`
**Fix:** Install Vercel CLI globally:
```bash
npm i -g vercel
```

### Issue: `vercel login` fails
**Fix:** Make sure you're logged into Vercel account and have access to the project

### Issue: Preview shows different data
**Fix:** Pull production environment variables first with `vercel env pull .env.production`, then run `vercel dev`. Make sure production env vars are set in Vercel dashboard.

---

**Summary:** Use `npm run preview:prod-env` to pull production env vars and preview, or test actual production deployment.

