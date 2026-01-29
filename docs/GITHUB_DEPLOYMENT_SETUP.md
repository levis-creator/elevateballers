# GitHub Deployment Setup for cPanel

This guide helps you set up automated deployments from GitHub to your cPanel server, eliminating the need to manually upload files for every update.

## Overview

Instead of manually uploading files, you'll:
1. Push changes to GitHub
2. SSH into your cPanel server
3. Pull changes and rebuild
4. Restart the application

## Prerequisites

- GitHub repository with your code
- SSH access to your cPanel server
- Git installed on the server (usually pre-installed)

## Step 1: Initial Setup on cPanel Server

### 1.1 SSH into Your Server

```bash
ssh username@your-server.com
# Or use cPanel Terminal
```

### 1.2 Navigate to Your Domain Directory

```bash
cd /home/elevateb/test.dev  # or your domain directory
# Usually: /home/username/domain.com or /home/username/public_html/domain.com
```

### 1.3 Initialize Git Repository (if not already done)

**Option A: Clone from GitHub (if starting fresh)**
```bash
# Backup existing files first!
cd /home/elevateb
mv test.dev test.dev.backup

# Clone your repository
git clone https://github.com/your-username/elevateballers.git test.dev
cd test.dev
```

**Option B: Initialize Git in existing directory**
```bash
cd /home/elevateb/test.dev
git init
git remote add origin https://github.com/your-username/elevateballers.git
git fetch
git checkout main  # or your default branch
```

### 1.4 Configure Git (if needed)

```bash
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

## Step 2: Create Deployment Script

Create an automated deployment script that handles:
- Pulling latest changes
- Installing dependencies
- Building the application
- Restarting the Node.js app

### 2.1 Create Deployment Script

Create `scripts/deploy.sh` in your project:

```bash
#!/bin/bash
# Deployment script for cPanel
# Usage: ./scripts/deploy.sh [branch]

set -e  # Exit on error

BRANCH=${1:-main}
PROJECT_DIR="/home/elevateb/test.dev"  # Update this to your directory
cd "$PROJECT_DIR"

echo "🚀 Starting deployment from branch: $BRANCH"
echo "📁 Working directory: $PROJECT_DIR"

# Pull latest changes
echo "📥 Pulling latest changes from GitHub..."
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps --production

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

# Build application
echo "🏗️  Building application..."
npm run build:cpanel

# Restart Node.js application
echo "🔄 Restarting application..."
# Note: Restart command depends on your cPanel setup
# You may need to restart via Node.js Selector or use PM2

echo "✅ Deployment complete!"
echo "💡 Don't forget to restart your Node.js app in cPanel Node.js Selector"
```

### 2.2 Make Script Executable

```bash
chmod +x scripts/deploy.sh
```

## Step 3: Create Update Script (Simpler Version)

For quick updates, create `scripts/update.sh`:

```bash
#!/bin/bash
# Quick update script - pulls and rebuilds
set -e

cd /home/elevateb/test.dev  # Update to your directory

echo "📥 Pulling latest changes..."
git pull origin main

echo "📦 Installing dependencies..."
npm install --legacy-peer-deps --production

echo "🔧 Generating Prisma Client..."
npx prisma generate

echo "🏗️  Building..."
npm run build:cpanel

echo "✅ Update complete! Restart your app in Node.js Selector."
```

## Step 4: Workflow for Updates

### Daily Update Workflow

1. **Make changes locally** and commit:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```

2. **SSH into server**:
   ```bash
   ssh username@your-server.com
   ```

3. **Run update script**:
   ```bash
   cd /home/elevateb/test.dev
   ./scripts/update.sh
   # Or manually:
   git pull origin main
   npm install --legacy-peer-deps --production
   npx prisma generate
   npm run build:cpanel
   ```

4. **Restart application** in cPanel:
   - Go to **Node.js Selector** → Your Application
   - Click **Restart Application**

## Step 5: Environment Variables

**Important:** Your `.env` file should NOT be in Git (it's in `.gitignore`).

After cloning, create `.env` on the server:

```bash
cd /home/elevateb/test.dev
nano .env  # or use your preferred editor
```

Add your environment variables:
```bash
DATABASE_URL="mysql://user:password@host:3306/database"
JWT_SECRET="your-secret-key"
NODE_ENV="production"
```

Set secure permissions:
```bash
chmod 600 .env
```

## Step 6: Handle Git Conflicts

If you have local changes on the server that conflict:

```bash
# Stash local changes
git stash

# Pull latest
git pull origin main

# Apply stashed changes (if needed)
git stash pop

# Resolve conflicts manually if any
```

## Step 7: Automated Deployment (Advanced)

For even more automation, you can set up a webhook or use GitHub Actions.

### Option A: GitHub Actions (Recommended)

Create `.github/workflows/deploy-cpanel.yml`:

```yaml
name: Deploy to cPanel

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.CPANEL_HOST }}
          username: ${{ secrets.CPANEL_USER }}
          key: ${{ secrets.CPANEL_SSH_KEY }}
          script: |
            cd /home/elevateb/test.dev
            git pull origin main
            npm install --legacy-peer-deps --production
            npx prisma generate
            npm run build:cpanel
            # Restart command (adjust based on your setup)
```

**Setup GitHub Secrets:**
- Go to GitHub → Your Repo → Settings → Secrets and variables → Actions
- Add:
  - `CPANEL_HOST` - Your server IP/hostname
  - `CPANEL_USER` - Your SSH username
  - `CPANEL_SSH_KEY` - Your SSH private key

### Option B: Webhook Script

Create a webhook endpoint that pulls and rebuilds (requires additional setup).

## Step 8: Best Practices

### 8.1 Branch Strategy

- **`main`** - Production (deployed to cPanel)
- **`develop`** - Development branch
- **Feature branches** - For new features

### 8.2 Pre-Deployment Checklist

Before deploying:
- [ ] Test changes locally
- [ ] Run `npm run build:cpanel` locally to verify build works
- [ ] Check that all environment variables are set on server
- [ ] Ensure database migrations are up to date

### 8.3 Post-Deployment Checklist

After deploying:
- [ ] Check server logs for errors
- [ ] Test critical pages (homepage, admin login, etc.)
- [ ] Verify database connections
- [ ] Check that new features work as expected

## Step 9: Troubleshooting

### Issue: Git pull fails with "permission denied"

**Solution:**
```bash
# Check file permissions
ls -la

# Fix ownership (replace username with your cPanel username)
chown -R username:username /home/elevateb/test.dev
```

### Issue: npm install fails

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps --production
```

### Issue: Build fails

**Solution:**
```bash
# Check Node.js version (should be 20+)
node --version

# Clear build cache
rm -rf dist .astro

# Rebuild
npm run build:cpanel
```

### Issue: Application doesn't restart

**Solution:**
- Manually restart in Node.js Selector
- Or use PM2 if installed:
  ```bash
  pm2 restart elevateballers
  ```

## Quick Reference Commands

```bash
# Full deployment
cd /home/elevateb/test.dev
git pull origin main
npm install --legacy-peer-deps --production
npx prisma generate
npm run build:cpanel
# Then restart in Node.js Selector

# Quick update (if only code changed, no new dependencies)
cd /home/elevateb/test.dev
git pull origin main
npm run build:cpanel
# Then restart

# Check current branch
git branch

# Check for uncommitted changes
git status

# View recent commits
git log --oneline -10
```

## Security Notes

1. **Never commit `.env`** - It's already in `.gitignore`
2. **Use SSH keys** instead of passwords for GitHub
3. **Set proper file permissions** - `.env` should be `600`
4. **Keep dependencies updated** - Run `npm audit` regularly
5. **Use strong JWT_SECRET** - Different from development

## Next Steps

1. Set up Git repository on server
2. Test the deployment workflow
3. Create deployment script
4. Document your specific server paths and commands
5. Consider setting up GitHub Actions for automation
