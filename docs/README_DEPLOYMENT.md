# Deployment Guide - Quick Start

## 🎯 Goal

Stop manually uploading files. Deploy updates by pulling from GitHub.

## 📋 Quick Setup (5 Minutes)

### 1. Commit Your Current Changes

```bash
git add .
git commit -m "Add GitHub deployment setup and fixes"
git push origin master
```

### 2. SSH into Your Server

```bash
ssh username@your-server.com
```

### 3. Set Up Git on Server

```bash
cd /home/elevateb/test.dev

# Option A: Initialize in existing directory
git init
git remote add origin https://github.com/your-username/elevateballers.git
git fetch origin
git checkout -b master
git branch --set-upstream-to=origin/master master
git pull origin master

# Option B: Fresh clone (backup first!)
cd /home/elevateb
mv test.dev test.dev.backup
git clone https://github.com/your-username/elevateballers.git test.dev
cd test.dev
```

### 4. Create .env File

```bash
nano .env
# Add: DATABASE_URL, JWT_SECRET, NODE_ENV
chmod 600 .env
```

### 5. Install & Build

```bash
npm install --legacy-peer-deps --production
npx prisma generate
npm run build:cpanel
chmod +x scripts/*.sh
```

### 6. Restart App

Go to cPanel → Node.js Selector → Restart Application

## 🚀 Daily Workflow (30 Seconds)

### Make Changes Locally
```bash
git add .
git commit -m "Your changes"
git push origin master
```

### Deploy on Server
```bash
ssh username@server.com
cd /home/elevateb/test.dev
./scripts/update.sh
# Then restart in Node.js Selector
```

**That's it!** No more manual uploads.

## 📚 Detailed Guides

- **`SETUP_GITHUB_DEPLOYMENT.md`** - Complete step-by-step setup
- **`GITHUB_DEPLOYMENT_SETUP.md`** - Advanced deployment options
- **`QUICK_DEPLOYMENT_GUIDE.md`** - Quick reference commands

## 🛠️ Scripts Available

- **`scripts/update.sh`** - Quick update (pull + build)
- **`scripts/deploy.sh`** - Full deployment (with checks)
- **`scripts/fix-invalid-dates.js`** - Fix database date issues

## ⚠️ Important Notes

1. **`.env` file** - Must be created on server (not in Git)
2. **`node_modules`** - Installed via npm (not in Git)
3. **`dist/`** - Built via npm (not in Git)
4. **Always restart** app in Node.js Selector after deployment

## 🆘 Need Help?

See troubleshooting sections in:
- `SETUP_GITHUB_DEPLOYMENT.md`
- `GITHUB_DEPLOYMENT_SETUP.md`
