# cPanel Deployment Guide - Fixing "Killed" npm install Issue

## Problem
cPanel is killing the `npm install` process due to:
- Memory limits (typically 512MB-1GB on shared hosting)
- Process execution time limits
- CPU usage restrictions

## Solutions (Choose One)

---

## ✅ Solution 1: Install Locally & Upload (RECOMMENDED)

This is the most reliable method for cPanel deployments.

### Steps:

1. **Install dependencies locally** (on your development machine):
   ```bash
   cd c:\Users\User\Desktop\projects\elevateballers
   npm install
   ```

2. **Create a production build**:
   ```bash
   npm run build:cpanel
   ```

3. **Upload to cPanel** using one of these methods:

   **Option A: Using Git (Recommended)**
   ```bash
   # Commit your changes
   git add .
   git commit -m "Fixed React 19 dependency conflicts"
   git push origin main
   
   # Then on cPanel terminal:
   cd ~/prod
   git pull origin main
   ```

   **Option B: Using File Manager**
   - Compress `node_modules` folder locally: `node_modules.zip`
   - Upload via cPanel File Manager
   - Extract on server

   **Option C: Using FTP/SFTP**
   - Use FileZilla or WinSCP
   - Upload the entire `node_modules` folder
   - This may take 30-60 minutes depending on connection speed

4. **On cPanel, just start the app**:
   ```bash
   cd ~/prod
   npm start
   ```

---

## 🔧 Solution 2: Increase Memory Limit (If You Have Access)

If you have VPS or dedicated hosting with root access:

1. **Create/edit `.htaccess` in your project root**:
   ```apache
   php_value memory_limit 2048M
   php_value max_execution_time 300
   ```

2. **Or edit `php.ini`** (if available):
   ```ini
   memory_limit = 2048M
   max_execution_time = 300
   ```

3. **Then try npm install**:
   ```bash
   npm install --prefer-offline --no-audit --no-fund
   ```

---

## 🚀 Solution 3: Install in Chunks (Advanced)

Install dependencies in smaller groups to avoid memory issues:

```bash
# Install production dependencies only
npm install --production --no-optional

# Then install dev dependencies
npm install --only=dev --no-optional
```

Or install critical packages first:
```bash
# Install framework dependencies
npm install astro @astrojs/node @astrojs/react react react-dom

# Install database
npm install @prisma/client prisma

# Install UI libraries
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu lucide-react

# Continue with remaining packages...
```

---

## 🎯 Solution 4: Use npm ci (Faster, Less Memory)

If you have `package-lock.json`:

```bash
npm ci --prefer-offline --no-audit --no-fund
```

This is faster and uses less memory than `npm install`.

---

## 📦 Solution 5: Build Locally, Deploy Build Only

For production, you only need the built files:

### Local Machine:
```bash
# 1. Install dependencies
npm install

# 2. Build for production
npm run build:cpanel

# 3. The build output is in 'dist/' folder
```

### Upload to cPanel:
- Upload only these folders/files:
  - `dist/` (built application)
  - `server.js` (Node.js server)
  - `package.json`
  - `package-lock.json`
  - `.env` (environment variables)
  - `prisma/` (database schema)

### On cPanel:
```bash
# Install ONLY production dependencies
npm install --production --prefer-offline

# Generate Prisma client
npx prisma generate

# Start the server
npm start
```

---

## 🔍 Solution 6: Use Node Version Manager (nvm)

Sometimes using a different Node.js version helps:

```bash
# Install nvm (if not already installed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node.js 20 (required by your project)
nvm install 20
nvm use 20

# Verify
node --version  # Should show v20.x.x

# Try install again
npm install --prefer-offline
```

---

## ⚡ Quick Fix Commands

Try these optimized install commands on cPanel:

```bash
# Option 1: Minimal output, offline cache
npm install --prefer-offline --no-audit --no-fund --loglevel=error

# Option 2: Production only
npm install --production --prefer-offline --no-audit

# Option 3: With legacy peer deps (if needed)
npm install --legacy-peer-deps --prefer-offline --no-audit

# Option 4: Clean install
rm -rf node_modules package-lock.json
npm cache clean --force
npm install --prefer-offline
```

---

## 📋 Recommended Workflow for cPanel

**Best Practice for Future Deployments:**

1. **Develop Locally**
   - Make changes on your local machine
   - Test thoroughly with `npm run dev`

2. **Build Locally**
   - Run `npm run build:cpanel`
   - Test the build with `npm run preview:cpanel`

3. **Commit to Git**
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```

4. **Deploy to cPanel**
   ```bash
   # SSH into cPanel
   cd ~/prod
   git pull origin main
   npm start  # or pm2 restart app
   ```

5. **For node_modules updates** (only when dependencies change):
   - Install locally
   - Compress: `tar -czf node_modules.tar.gz node_modules/`
   - Upload to cPanel
   - Extract: `tar -xzf node_modules.tar.gz`

---

## 🆘 If All Else Fails

Contact your hosting provider and ask them to:
1. Temporarily increase memory limit for your account
2. Whitelist npm/node processes from being killed
3. Or consider upgrading to VPS/Cloud hosting for better Node.js support

---

## ✨ Current Status

Your project has been updated to remove the problematic dependencies:
- ✅ Removed `@g-loot/react-tournament-brackets`
- ✅ Removed `react-brackets`
- ✅ Removed `styled-components`
- ✅ Created custom `SimpleBracket` component (React 19 compatible)

**You should now be able to install without peer dependency conflicts!**

---

## 📞 Need Help?

If you continue to have issues:
1. Check cPanel error logs: `~/logs/` or `~/public_html/logs/`
2. Check Node.js version: `node --version` (should be 20.x.x)
3. Check available memory: `free -h`
4. Contact your hosting provider's support
