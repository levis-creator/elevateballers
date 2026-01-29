# cPanel Production Login Troubleshooting Guide

## Problem: Login Not Redirecting After Successful Login

If you can access `/admin/login` but after logging in, you're not redirected to `/admin` or you're redirected back to login, follow these steps:

## Quick Checklist

1. ✅ **JWT_SECRET is set** in cPanel Node.js Selector → Environment Variables
2. ✅ **DATABASE_URL is set** and uses MySQL format: `mysql://user:password@host:3306/database`
3. ✅ **Cookies are being set** (check browser DevTools → Application → Cookies)
4. ✅ **Site is accessible** (HTTP or HTTPS - both should work now)

## Step-by-Step Debugging

### Step 1: Check Server Logs

In cPanel Node.js Selector → Your Application → **View Logs**, look for:

```
Login successful (cPanel): {
  userId: '...',
  email: '...',
  isProduction: true,
  isSecure: true/false,  // Should match your site protocol
  url: '...',
  forwardedProto: 'https' or 'http',
  ...
}
```

**What to check:**
- If `isSecure: false` but your site is HTTPS, cookies won't work properly
- If you see errors about `JWT_SECRET`, it's not configured correctly
- If you see database errors, check `DATABASE_URL`

### Step 2: Check Browser Console

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Try logging in
4. Look for:
   - `Login successful, redirecting...` message
   - Any JavaScript errors
   - Network errors

### Step 3: Check Browser Cookies

1. Open browser DevTools (F12)
2. Go to **Application** tab → **Cookies** → Your domain
3. After logging in, check if `auth-token` cookie exists
4. **Check cookie properties:**
   - **HttpOnly**: Should be ✅ (checked)
   - **Secure**: Should match your site protocol (✅ for HTTPS, ❌ for HTTP)
   - **SameSite**: Should be `Lax`
   - **Path**: Should be `/`
   - **Expires**: Should be ~7 days from now

**If cookie is missing:**
- Check if site is HTTPS but cookie has `Secure: false` (or vice versa)
- Check browser console for cookie-related errors
- Try clearing all cookies and logging in again

### Step 4: Check Network Tab

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Try logging in
4. Find the `/api/auth/login` request
5. **Check:**
   - **Status**: Should be `200 OK`
   - **Response**: Should contain user data
   - **Set-Cookie header**: Should be present in response headers
   - **Request headers**: Should include `Content-Type: application/json`

**If request fails:**
- Check the error message in response
- Check server logs for detailed error
- Verify credentials are correct

### Step 5: Verify Environment Variables

**In cPanel Node.js Selector:**

1. Go to **Node.js Selector** → Your Application
2. Click **Environment Variables**
3. Verify these are set:
   - `DATABASE_URL` = `mysql://user:password@host:3306/database`
   - `JWT_SECRET` = (a strong random string)
   - `NODE_ENV` = `production`

**Generate JWT_SECRET if missing:**
```bash
openssl rand -base64 32
```

**Important:** After adding/updating environment variables:
1. Click **Save**
2. **Restart Application** in Node.js Selector
3. Wait for restart to complete

### Step 6: Test Database Connection

Via SSH:
```bash
cd /home/elevateb/test.dev  # or your domain directory
export DATABASE_URL="mysql://user:password@host:3306/database"
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => console.log('✅ Connected!')).catch(e => console.error('❌ Error:', e))"
```

### Step 7: Verify Admin User Exists

Via SSH:
```bash
cd /home/elevateb/test.dev
export DATABASE_URL="mysql://user:password@host:3306/database"
npm run create-admin
```

Or manually check database:
```sql
SELECT * FROM users WHERE email = 'your-admin-email@example.com';
```

## Common Issues & Solutions

### Issue 1: Cookie Not Being Set

**Symptoms:**
- Login succeeds (200 OK response)
- But no `auth-token` cookie in browser
- Redirects back to login page

**Solutions:**
1. **Check HTTPS detection:**
   - If site is HTTP, cookie should have `Secure: false`
   - If site is HTTPS, cookie should have `Secure: true`
   - Check server logs for `isSecure` value

2. **Check SameSite setting:**
   - Should be `Lax` (not `Strict`)
   - `Strict` can cause issues with redirects

3. **Clear browser cookies:**
   - Clear all cookies for your domain
   - Try logging in again

### Issue 2: Cookie Set But Not Read

**Symptoms:**
- Cookie exists in browser
- But `/admin` redirects back to `/admin/login`

**Solutions:**
1. **Check JWT_SECRET:**
   - Must be set in environment variables
   - Must be the same value used when creating tokens
   - Restart application after setting

2. **Check cookie domain:**
   - Cookie should be set for your domain
   - Not for `localhost` or wrong domain

3. **Check token expiration:**
   - Tokens expire after 7 days
   - Try logging in again to get fresh token

### Issue 3: Database Connection Errors

**Symptoms:**
- Login fails with database error
- Server logs show connection errors

**Solutions:**
1. **Verify DATABASE_URL format:**
   ```
   ✅ CORRECT: mysql://user:password@host:3306/database
   ❌ WRONG: postgresql://user:password@host:5432/database
   ```

2. **Check database credentials:**
   - Username and password are correct
   - Database exists
   - User has proper permissions

3. **Check database server:**
   - MySQL/MariaDB is running
   - Port 3306 is accessible
   - Firewall allows connections

### Issue 4: Redirect Loop

**Symptoms:**
- Login succeeds
- Redirects to `/admin`
- Immediately redirects back to `/admin/login`
- Repeats indefinitely

**Solutions:**
1. **Check SSR on admin index:**
   - `src/pages/admin/index.astro` should have `ssr = true`
   - This ensures server-side auth check works

2. **Check cookie path:**
   - Cookie should have `path: /`
   - Not a subdirectory path

3. **Check browser console:**
   - Look for JavaScript errors
   - Check if Dashboard component is loading

## Testing After Fixes

1. **Clear browser data:**
   - Clear cookies for your domain
   - Clear cache
   - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

2. **Test login flow:**
   - Go to `/admin/login`
   - Enter credentials
   - Should redirect to `/admin`
   - Should see dashboard (not redirect back to login)

3. **Check logs:**
   - Server logs should show successful login
   - No authentication errors
   - No database errors

## Still Not Working?

If none of the above fixes work:

1. **Check server.js logs:**
   - Look for any errors in the request handler
   - Check if SSR handler is working correctly

2. **Verify build:**
   - Rebuild: `npm run build:cpanel`
   - Upload fresh `dist/` folder
   - Restart application

3. **Check file permissions:**
   - `.env` should be `600`
   - `dist/` should be readable
   - `server.js` should be executable

4. **Contact hosting support:**
   - Ask about Node.js version compatibility
   - Ask about cookie/header restrictions
   - Ask about proxy/load balancer configuration
