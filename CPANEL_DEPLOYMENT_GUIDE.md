# cPanel Deployment Guide - Fixing "Killed" npm install Issue

## ⚠️ "Killed" when running npm install? Do NOT run npm on cPanel

If cPanel kills `npm i --production` or `npm install` (process gets **Killed**), the host is hitting memory/CPU limits. **Do not run npm install on the server.** Install and package everything on your PC, then upload.

### Steps that work

**1. On your Windows PC (in the project folder):**
```bat
scripts\create-cpanel-package.bat
```
This installs dependencies, builds the app, and creates `cpanel-deployment.zip` with `dist/`, `node_modules/`, `server.js`, `package.json`, `prisma/`, etc.

**2. On cPanel:**
- Upload `cpanel-deployment.zip` via **File Manager**.
- **Extract** so that `server.js`, `node_modules/`, and `dist/` are **in the same folder** (e.g. `~/prod`).  
  - If your zip creates a single folder (e.g. after extract you see `prod/cpanel-deployment/node_modules`), use that folder as the app root (e.g. Application Root = `prod/cpanel-deployment`) or move its contents up into `prod`.
- Create or edit `.env` in that folder with your `DATABASE_URL`, `JWT_SECRET`, etc. (Do not commit real `.env`; set it on the server.)
- In terminal, **from that same folder** (the one that contains `server.js` and `node_modules`), run:
  ```bash
  cd ~/prod
  npx prisma generate
  npm start
  ```
  Or use `./run.sh` after `chmod +x run.sh`.  
  `npx prisma generate` is lightweight (fixes Linux binaries); only `npm start` (or `./run.sh`) is required if the package was built correctly.

**3. In cPanel Node.js Selector:** set **Application Root** to the folder that contains `server.js` and `node_modules` (e.g. `prod` or `prod/cpanel-deployment`). Set **Startup File** to `server.js` or `run.sh`.

You do **not** need to run `npm install` or `npm i --production` on cPanel when using this method.

---

## 📥 Deploy via GitHub (import project into cPanel using Git)

Use this when you want to clone the repo on cPanel and update with `git pull`. Because **npm install often fails** on cPanel (Killed / ENOTEMPTY), the first deploy still uses a **pre-built package from your PC**; Git is used for code and for future updates.

### First-time: Clone repo on cPanel

**Option A – cPanel Git™ Version Control (if available)**  
1. In cPanel, open **Git™ Version Control**.  
2. Click **Create**.  
3. **Repository URL:** `https://github.com/YOUR_USERNAME/elevateballers.git` (or your repo URL).  
4. **Repository Path:** e.g. `elevateballers` or `prod` (folder will be created under your home directory).  
5. Clone the repository.  
6. Your project will be at e.g. `~/elevateballers` or `~/prod`.

**Option B – Terminal / SSH**  
```bash
cd ~
git clone https://github.com/YOUR_USERNAME/elevateballers.git prod
cd prod
```

Replace `YOUR_USERNAME/elevateballers` with your GitHub username and repo name. Use `prod` or any folder name you prefer.

### First-time: Add built app and start (no npm install on server)

The clone only has **source code**. You need **dist**, **node_modules**, and **server.js** from a build on your PC.

1. **On your Windows PC** (in the project folder):
   ```bat
   scripts\create-cpanel-package.bat
   ```
   This creates `cpanel-deployment.zip` with `dist/`, `node_modules/`, `server.js`, `package.json`, `prisma/`, etc.

2. **On cPanel:**  
   - Open **File Manager** and go to the folder you cloned (e.g. `~/prod` or `~/elevateballers`).  
   - Upload `cpanel-deployment.zip` into **that same folder**.  
   - **Extract** the zip there so that `server.js`, `node_modules/`, and `dist/` are **inside the repo folder** (same level as `package.json`).  
   - If the zip extracts into a subfolder (e.g. `cpanel-deployment/`), move its contents up into the repo root:
     ```bash
     cd ~/prod
     mv cpanel-deployment/* .
     mv cpanel-deployment/.* . 2>/dev/null || true
     rmdir cpanel-deployment 2>/dev/null || true
     ```

3. **Create `.env`** in the repo folder (e.g. `~/prod/.env`) with:
   ```env
   DATABASE_URL="mysql://user:password@host:3306/database"
   JWT_SECRET="your-secret"
   ```
   Do not commit `.env`; keep it only on the server.

4. **From the repo folder in Terminal:**
   ```bash
   cd ~/prod
   npx prisma generate
   npm start
   ```

5. **Node.js app in cPanel:**  
   - **Application Root:** the folder that contains `server.js` and `node_modules` (e.g. `prod` or `elevateballers`).  
   - **Startup File:** `server.js` (or `run.sh` if you use it).  
   - Start the application.

You have now “imported” the project into cPanel using GitHub and the pre-built zip; no `npm install` was run on the server.

### Updating the app via GitHub

**Code-only changes (no new dependencies):**

1. On cPanel, in the repo folder:
   ```bash
   cd ~/prod
   git pull origin main
   ```
   (Use your branch name if different, e.g. `master`.)

2. Rebuild and redeploy the app. Choose one:
   - **If your host can run the build:**  
     `npm run build` (or `npm run build:cpanel`). Then restart the Node app.
   - **If npm/build often fails on the server:**  
     On your PC run `scripts\create-cpanel-package.bat`, upload the new `cpanel-deployment.zip`, extract **into** the same repo folder (overwrite `dist/`, `server.js`, etc.), then restart the Node app.

**When package.json or dependencies change:**

1. On your PC: run `scripts\create-cpanel-package.bat` to get a new zip with updated `node_modules` and build.  
2. On cPanel: `git pull origin main` in the repo folder.  
3. Upload and extract the new `cpanel-deployment.zip` into the repo folder (overwrite existing files).  
4. In the repo folder: `npx prisma generate` (if needed), then restart the Node app.

### Summary

| Step              | Where      | Action |
|-------------------|------------|--------|
| Clone repo        | cPanel     | Git clone (or cPanel Git™ Version Control) |
| First deploy      | PC + cPanel| Build with `create-cpanel-package.bat`, upload zip, extract into repo folder, add `.env`, `npx prisma generate`, `npm start` |
| Code updates      | cPanel     | `git pull`, then rebuild (on server or PC) and restart |
| Dependency updates| PC + cPanel| New zip from PC, upload into repo folder, then `npx prisma generate` and restart |

---

## 🚨 TROUBLESHOOTING: ENOTEMPTY Error

If you're getting this error:
```
npm error ENOTEMPTY: directory not empty, rename '/home/elevateb/nodevenv/prod/20/lib/node_modules/astro'
```

**Cause:** npm is installing into cPanel’s Node virtual env, and a previous install left `node_modules/astro` in a bad state, so the rename fails.

**Fix (recommended):** Do **not** run `npm i --production` on cPanel. Use the **Local Package Method** above:

1. **On your Windows PC** (in the project folder), run:
   ```bat
   scripts\create-cpanel-package.bat
   ```
2. Upload `cpanel-deployment.zip` to cPanel, extract it into your app directory (e.g. `~/prod`).
3. **On cPanel**, in that directory run only:
   ```bash
   npx prisma generate
   npm start
   ```
   You do **not** need to run `npm install` on the server.

**If you must fix in place on the server** (e.g. you already have the app there and want to clear the error): remove the virtual env’s `node_modules` so the next install isn’t blocked, then switch to the package method for future deploys. From SSH:
   ```bash
   rm -rf /home/elevateb/nodevenv/prod/20/lib/node_modules/astro
   rm -rf /home/elevateb/nodevenv/prod/20/lib/node_modules/.astro-*
   ```
   Then use the package-from-PC method above; do not run `npm i --production` again on cPanel.

---

## 🚨 TROUBLESHOOTING: Cannot find package 'react' (ERR_MODULE_NOT_FOUND)

If you see:
```
Error: Cannot find package '/home/elevateb/prod/node_modules/react/index.js' imported from /home/elevateb/prod/dist/server/renderers.mjs
```
or
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'react' imported from .../dist/server/renderers.mjs
```

**Cause:** Node is running from a directory where `node_modules` is missing or not next to `server.js`. The SSR build needs `react` (and other deps) from `node_modules` in the **same folder** as `server.js` and `dist/`.

**Fix:**

1. **Check your app folder on cPanel** (the folder where you run `npm start` or where Application Root points):
   ```bash
   cd ~/prod
   ls -la node_modules/react
   ```
   If that fails or shows "No such file", `node_modules` is missing or in the wrong place.

2. **Correct extraction:** When you extract `cpanel-deployment.zip`, the zip contents (e.g. `node_modules/`, `dist/`, `server.js`, `package.json`) must end up **directly** in your app folder—not inside a subfolder.
   - **If you extracted and got a subfolder** (e.g. `~/prod/cpanel-deployment/` with `node_modules` inside it): set **Application Root** to that subfolder (e.g. `prod/cpanel-deployment`) and **Startup File** to `server.js`, then run from there: `cd ~/prod/cpanel-deployment && npx prisma generate && npm start`.
   - **Or** move everything up: `mv ~/prod/cpanel-deployment/* ~/prod/` (and `mv ~/prod/cpanel-deployment/.* ~/prod/` if needed), then run from `~/prod`.

3. **Use the packaged zip, don’t skip node_modules:** Deploy using `scripts\create-cpanel-package.bat` and upload the full zip. Do **not** upload only `dist/` + `server.js` and then run `npm install` on cPanel (that often fails with ENOTEMPTY or Killed).

4. **Start from the app directory:** In cPanel Node.js app, set **Application Root** to the folder that contains **both** `server.js` and `node_modules`. Startup File: `server.js` (or `run.sh` if you use the script). Then start the app.

5. **Optional: use run.sh:** The project includes `run.sh` that changes to the script directory and runs `node server.js`. Copy it into your app folder, make it executable (`chmod +x run.sh`), and set Startup File to `run.sh` so the app always runs with the correct working directory.

---

## 🚨 TROUBLESHOOTING: Pool timeout / RSA public key (MySQL/MariaDB)

If you see:
```
pool timeout: failed to retrieve a connection from pool after 10014ms
cause: RSA public key is not available client side. Either set option `cachingRsaPublicKey` to indicate public key path, or allow public key retrieval with option `allowPublicKeyRetrieval`
```

**Cause:** Your MySQL/MariaDB server uses `caching_sha2_password` and requires RSA key exchange. The client must allow public key retrieval.

**Fix:** The project already sets `allowPublicKeyRetrieval: true` in `src/lib/prisma.ts`. Redeploy so the server runs the latest code:

1. On your PC: run `scripts\create-cpanel-package.bat`, upload the new `cpanel-deployment.zip`, extract into your app folder.
2. On cPanel: ensure `.env` has the correct `DATABASE_URL` (e.g. `mysql://user:password@host:3306/database`). Then from the app folder: `npx prisma generate` and `npm start` (or restart the Node app).

If the error persists, confirm your hosting DB allows remote connections and that the user has the right host (e.g. `%` or your server IP).

---

## 🚨 TROUBLESHOOTING: require is not defined (server.js)

If you see:
```
file:///home/elevateb/prod/server.js:1
var http = require('http');
           ^
ReferenceError: require is not defined
```

**Cause:** The `server.js` on cPanel is an **old CommonJS version**. Your app uses **ESM** (`import`/`export`). With `"type": "module"` in package.json, Node runs `.js` as ESM, so `require()` is not defined. The file on the server still has `var http = require('http');` from an old deploy.

**Fix (choose one):**

1. **Option A – Use server.cjs (easiest)**  
   The project includes a **CommonJS** entry point `server.cjs` that works when Node treats `.js` as ESM.  
   - Ensure `server.cjs` is in your app folder (it’s in `cpanel-deployment.zip`).  
   - In cPanel **Node.js** app, set **Startup File** to **`server.cjs`** (not `server.js`).  
   - Restart the application. No file editing needed.

2. **Option B – Re-upload the deployment zip**  
   On your PC run `scripts\create-cpanel-package.bat`, upload the new `cpanel-deployment.zip` to cPanel, extract **into** your app folder so it overwrites `server.js` with the current ESM version. Set Startup File to `server.js` and restart.

3. **Option C – Replace only server.js**  
   On your PC copy the full contents of `server.js` (it must start with `import { createServer } from 'http';`). On cPanel File Manager edit `~/prod/server.js`, paste, save. Restart the Node app.

---

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
