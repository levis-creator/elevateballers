# Admin Portal Production Fix

## Problem
The admin portal (`/admin`) was not accessible in production, even though it worked in local development.

## Root Causes

1. **JWT_SECRET not set in Vercel** - Token verification was failing silently
2. **Cookie handling** - Secure cookie flag might not have been set correctly
3. **Error logging** - Errors were being swallowed, making debugging difficult
4. **SSR configuration** - Admin pages had `ssr = false` which could cause issues

## Fixes Applied

### 1. Improved Error Logging (`src/features/cms/lib/auth-astro.ts`)
- Added detailed error logging to identify authentication failures
- Added check for missing JWT_SECRET with clear error messages
- Logs authentication status in development mode

### 2. Fixed Cookie Secure Flag (`src/pages/api/auth/login.ts`)
- Improved detection of production environment
- Checks multiple environment indicators: `import.meta.env.PROD`, `import.meta.env.MODE`, and `process.env.NODE_ENV`
- Ensures secure cookies are used in production (HTTPS only)

### 3. Enhanced JWT Verification (`src/features/cms/lib/auth.ts`)
- Added validation to check if JWT_SECRET is properly configured
- Improved error messages for token verification failures
- Added development logging for debugging

### 4. Enabled SSR for Admin Pages (`src/pages/admin/index.astro`)
- Changed `ssr = false` to `ssr = true` for the main admin dashboard
- This ensures server-side authentication checks work correctly
- React components still hydrate on the client

## Required Actions

### 1. Set JWT_SECRET in Vercel Dashboard

**This is the most critical step!**

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new variable:
   - **Name**: `JWT_SECRET`
   - **Value**: Generate a strong secret (see below)
   - **Environments**: ✅ Production (and Preview if needed)
4. Click **Save**

**Generate a secure JWT secret:**
```bash
openssl rand -base64 32
```

Or use an online generator. **Important**: Use a different secret than your development environment!

### 2. Redeploy Your Application

After setting JWT_SECRET:
1. Go to **Deployments** tab in Vercel
2. Click the **"..."** menu on your latest deployment
3. Select **"Redeploy"**

Or push a new commit to trigger a deployment.

### 3. Verify Environment Variables

Make sure these are set in Vercel:
- ✅ `DATABASE_URL` - Your production database connection
- ✅ `JWT_SECRET` - Your production JWT secret (different from dev)
- ✅ `NODE_ENV` - Set to `production`

## Testing

1. **Test Login:**
   - Go to `https://your-domain.com/admin/login`
   - Log in with your admin credentials
   - You should be redirected to `/admin` dashboard

2. **Check Browser Console:**
   - Open browser DevTools (F12)
   - Check the Console tab for any errors
   - Check the Network tab to see if `/api/auth/me` returns 200

3. **Check Vercel Logs:**
   - Go to Vercel Dashboard → Deployments → Select deployment → Functions → Logs
   - Look for any authentication errors
   - The improved logging will show detailed error messages

## Troubleshooting

### Issue: Still can't access admin portal

**Check:**
1. Is `JWT_SECRET` set in Vercel dashboard? (Most common issue)
2. Have you redeployed after setting environment variables?
3. Are you using HTTPS? (Required for secure cookies in production)
4. Check Vercel function logs for error messages

### Issue: Login works but redirects back to login

**Possible causes:**
- JWT_SECRET mismatch between login and verification
- Cookie not being set/read correctly
- Token expiration (tokens expire after 7 days)

**Solution:**
- Clear browser cookies and try again
- Check Vercel logs for JWT verification errors
- Verify JWT_SECRET is the same value used when creating tokens

### Issue: "JWT_SECRET is not properly configured" error

**Solution:**
- Ensure JWT_SECRET is set in Vercel dashboard
- Redeploy after adding the variable
- Verify the variable name is exactly `JWT_SECRET` (case-sensitive)

## Additional Notes

- The admin portal now uses SSR (`ssr = true`) for better server-side authentication
- React components still work normally with client-side hydration
- All admin pages should work the same way - if one works, all should work
- Consider updating other admin pages to use `ssr = true` if you encounter issues

## Files Modified

1. `src/features/cms/lib/auth-astro.ts` - Improved error logging
2. `src/pages/api/auth/login.ts` - Fixed cookie secure flag
3. `src/features/cms/lib/auth.ts` - Enhanced JWT verification
4. `src/pages/admin/index.astro` - Enabled SSR

---

**Last Updated**: January 2025

