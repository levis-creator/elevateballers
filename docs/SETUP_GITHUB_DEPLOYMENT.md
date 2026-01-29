# Step-by-Step: Setting Up GitHub Deployment

Follow these steps to set up automated deployments from GitHub to your cPanel server.

## Part 1: Prepare Your Local Repository

### Step 1: Commit All Your Changes

You have uncommitted changes. Let's commit them:

```bash
# Add all changes
git add .

# Commit with a descriptive message
git commit -m "Add cPanel deployment setup, fix invalid dates, improve login/auth"

# Push to GitHub
git push origin master
```

**Note:** Your branch is `master`, not `main`. That's fine - the scripts will detect it automatically.

## Part 2: Set Up Git on Your cPanel Server

### Step 2: SSH into Your Server

```bash
ssh username@your-server.com
# Or use cPanel → Terminal
```

### Step 3: Navigate to Your Domain Directory

```bash
cd /home/elevateb/test.dev
# Update this path to match your actual domain directory
```

### Step 4: Initialize Git Repository

**Option A: If you want to keep existing files and add Git**

```bash
cd /home/elevateb/test.dev

# Initialize git
git init

# Add your GitHub repository as remote
git remote add origin https://github.com/your-username/elevateballers.git

# Fetch from GitHub
git fetch origin

# Check what branch you're using
git branch -a

# Link to your GitHub branch (master)
git checkout -b master
git branch --set-upstream-to=origin/master master

# Pull the code (this might conflict with existing files)
git pull origin master
```

**Option B: Fresh Start (Recommended if you can backup)**

```bash
# Backup existing directory
cd /home/elevateb
mv test.dev test.dev.backup

# Clone fresh from GitHub
git clone https://github.com/your-username/elevateballers.git test.dev
cd test.dev

# Verify you're on the right branch
git branch
```

### Step 5: Create .env File on Server

```bash
cd /home/elevateb/test.dev
nano .env
```

Add your environment variables:
```bash
DATABASE_URL="mysql://user:password@host:3306/database"
JWT_SECRET="your-secret-key-here"
NODE_ENV="production"
```

Save (Ctrl+X, then Y, then Enter) and set permissions:
```bash
chmod 600 .env
```

### Step 6: Install Dependencies

```bash
cd /home/elevateb/test.dev
npm install --legacy-peer-deps --production
```

### Step 7: Generate Prisma Client

```bash
npx prisma generate
```

### Step 8: Build Application

```bash
npm run build:cpanel
```

### Step 9: Make Scripts Executable

```bash
chmod +x scripts/deploy.sh scripts/update.sh
```

### Step 10: Restart Application

Go to cPanel → Node.js Selector → Your Application → **Restart Application**

## Part 3: Test the Deployment Workflow

### Step 11: Make a Test Change Locally

1. Make a small change (e.g., add a comment to a file)
2. Commit and push:
   ```bash
   git add .
   git commit -m "Test deployment workflow"
   git push origin master
   ```

### Step 12: Deploy on Server

SSH into server and run:
```bash
cd /home/elevateb/test.dev
./scripts/update.sh
```

Or manually:
```bash
cd /home/elevateb/test.dev
git pull origin master
npm install --legacy-peer-deps --production
npx prisma generate
npm run build:cpanel
```

Then restart in Node.js Selector.

## Part 4: Daily Workflow (Going Forward)

### Making Updates

1. **Make changes locally**
2. **Test locally**: `npm run build:cpanel`
3. **Commit and push**:
   ```bash
   git add .
   git commit -m "Description of changes"
   git push origin master
   ```
4. **SSH into server**
5. **Run update script**:
   ```bash
   cd /home/elevateb/test.dev
   ./scripts/update.sh
   ```
6. **Restart app** in Node.js Selector

That's it! No more manual file uploads.

## Troubleshooting

### "fatal: not a git repository"

You're not in a git repository. Run:
```bash
cd /home/elevateb/test.dev
git init
git remote add origin https://github.com/your-username/elevateballers.git
```

### "Permission denied" when running scripts

```bash
chmod +x scripts/deploy.sh scripts/update.sh
```

### Git pull conflicts with local changes

```bash
# Stash your changes
git stash

# Pull latest
git pull origin master

# If you need your stashed changes back
git stash pop
```

### Wrong branch name

The scripts detect your current branch automatically. If you need to specify:
```bash
./scripts/deploy.sh master  # or main, or your branch name
```

## Files You Need to Keep Out of Git

These are already in `.gitignore`:
- `node_modules/` - Will be installed via npm
- `dist/` - Will be built via npm run build
- `.env` - Your environment variables (create on server)
- `.astro/` - Build cache

## Security Checklist

- [ ] `.env` file is NOT in Git (check `.gitignore`)
- [ ] `.env` has permissions `600` on server
- [ ] `JWT_SECRET` is different from development
- [ ] `DATABASE_URL` uses production database
- [ ] SSH keys are set up (not using passwords)

## Next Steps

1. ✅ Commit your current changes locally
2. ✅ Push to GitHub
3. ✅ Set up Git on server
4. ✅ Test the deployment workflow
5. ✅ Document your specific server paths

## Quick Reference

```bash
# Local workflow
git add .
git commit -m "Your message"
git push origin master

# Server workflow
ssh username@server.com
cd /home/elevateb/test.dev
./scripts/update.sh
# Then restart in Node.js Selector
```
