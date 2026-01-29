# Quick GitHub Deployment Guide

## One-Time Setup (Do This First)

### 1. Push Your Code to GitHub

If you haven't already:
```bash
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/elevateballers.git
git push -u origin main
```

### 2. SSH into Your cPanel Server

```bash
ssh username@your-server.com
# Or use cPanel Terminal
```

### 3. Navigate to Your Domain Directory

```bash
cd /home/elevateb/test.dev  # Update to your actual path
```

### 4. Clone Repository (First Time Only)

**Option A: Fresh Clone (if you want to start clean)**
```bash
# Backup existing files first!
cd /home/elevateb
mv test.dev test.dev.backup

# Clone repository
git clone https://github.com/your-username/elevateballers.git test.dev
cd test.dev
```

**Option B: Initialize Git in Existing Directory**
```bash
cd /home/elevateb/test.dev
git init
git remote add origin https://github.com/your-username/elevateballers.git
git fetch
git checkout -b main  # or your branch name
git branch --set-upstream-to=origin/main main
```

### 5. Create .env File on Server

```bash
nano .env  # or use your preferred editor
```

Add:
```bash
DATABASE_URL="mysql://user:password@host:3306/database"
JWT_SECRET="your-secret-key"
NODE_ENV="production"
```

Save and set permissions:
```bash
chmod 600 .env
```

### 6. Install Dependencies and Build

```bash
npm install --legacy-peer-deps --production
npx prisma generate
npm run build:cpanel
```

### 7. Make Deployment Scripts Executable

```bash
chmod +x scripts/deploy.sh scripts/update.sh
```

## Daily Update Workflow

### Method 1: Using Update Script (Easiest)

1. **Make changes locally** and push to GitHub:
   ```bash
   git add .
   git commit -m "Your changes"
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
   ```

4. **Restart app** in cPanel Node.js Selector

### Method 2: Manual Commands

```bash
cd /home/elevateb/test.dev
git pull origin main
npm install --legacy-peer-deps --production
npx prisma generate
npm run build:cpanel
# Then restart in Node.js Selector
```

### Method 3: Full Deployment Script

```bash
cd /home/elevateb/test.dev
./scripts/deploy.sh main
# Then restart in Node.js Selector
```

## What Gets Deployed

✅ **Included in Git:**
- Source code (`src/`)
- Configuration files (`package.json`, `prisma/`, etc.)
- Build scripts
- Documentation

❌ **NOT in Git (created on server):**
- `node_modules/` (installed via npm)
- `dist/` (built via npm run build)
- `.env` (environment variables)
- `.astro/` (build cache)

## Troubleshooting

### "Permission denied" when running scripts

```bash
chmod +x scripts/deploy.sh scripts/update.sh
```

### Git pull fails

```bash
# Check if you have uncommitted changes
git status

# Stash changes if needed
git stash
git pull origin main
git stash pop  # Restore changes if needed
```

### Build fails after pull

```bash
# Clear cache and rebuild
rm -rf node_modules dist .astro
npm install --legacy-peer-deps --production
npx prisma generate
npm run build:cpanel
```

### Can't find scripts

Make sure you're in the project root:
```bash
pwd  # Should show /home/elevateb/test.dev
ls scripts/  # Should show deploy.sh and update.sh
```

## Pro Tips

1. **Test locally first**: Always run `npm run build:cpanel` locally before pushing
2. **Commit often**: Small commits are easier to debug
3. **Use branches**: Create feature branches for major changes
4. **Check logs**: After deployment, check Node.js Selector logs
5. **Backup before major updates**: `cp -r test.dev test.dev.backup`

## Next Level: Automated Deployment

See `GITHUB_DEPLOYMENT_SETUP.md` for:
- GitHub Actions automation
- Webhook-based deployment
- Advanced workflows
