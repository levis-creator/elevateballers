# Deployment Guide - cPanel & Vercel

This guide covers deploying the Elevate Ballers application to both **cPanel** and **Vercel** platforms.

## Quick Start

### For Vercel Deployment
```bash
npm run build:vercel
vercel --prod
```

### For cPanel Deployment
```bash
npm run build:cpanel
# Then upload dist/, server.js, package.json, and node_modules/ to cPanel
```

## Architecture Overview

The application is configured to support both deployment targets:

- **Vercel**: Uses `@astrojs/vercel` adapter (serverless functions)
- **cPanel**: Uses `@astrojs/node` adapter (standalone Node.js server)

The adapter is automatically selected based on the `DEPLOY_TARGET` environment variable:
- `DEPLOY_TARGET=vercel` → Vercel adapter
- `DEPLOY_TARGET=cpanel` (or unset) → Node.js adapter

---

## Vercel Deployment

### Prerequisites
- Vercel account ([sign up](https://vercel.com))
- Git repository (GitHub, GitLab, or Bitbucket)
- PostgreSQL database (Vercel Postgres, Supabase, Neon, etc.)

### Step 1: Initial Setup

1. **Connect Repository to Vercel**
   - Go to [vercel.com](https://vercel.com) and sign in
   - Click **"Add New Project"**
   - Import your Git repository
   - Vercel will auto-detect Astro framework

2. **Configure Build Settings**
   - Framework Preset: `Astro` (auto-detected)
   - Build Command: `npm run build:vercel` (or `DEPLOY_TARGET=vercel npm run build`)
   - Output Directory: `dist` (auto-detected)
   - Install Command: `npm install` (auto-detected)
   - Root Directory: `.` (root)

### Step 2: Environment Variables

Add these in **Settings** → **Environment Variables**:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db?schema=public` |
| `JWT_SECRET` | Secret key for JWT tokens | Generate with: `openssl rand -base64 32` |
| `NODE_ENV` | Environment mode | `production` |
| `DEPLOY_TARGET` | Deployment target (optional, defaults to vercel) | `vercel` |

**Optional Feature Flags:**
- `FEATURE_FLAG_HOME_POST_SLIDER=true`
- `FEATURE_FLAG_HOME_NEWS_TICKER=true`
- Or use `FEATURE_FLAGS` JSON format: `{"home.postSlider":true}`

### Step 3: Database Setup

**Option A: Vercel Postgres (Recommended)**
1. In Vercel dashboard → **Storage** tab
2. Click **"Create Database"** → Select **Postgres**
3. Choose plan and region
4. `DATABASE_URL` is automatically added

**Option B: External PostgreSQL**
1. Get connection string from your provider (Supabase, Neon, etc.)
2. Add as `DATABASE_URL` environment variable
3. Ensure SSL is enabled (add `?sslmode=require` if needed)

### Step 4: Run Database Migrations

```bash
# Set production DATABASE_URL
export DATABASE_URL="your-production-connection-string"

# Run migrations
npx prisma migrate deploy
npx prisma generate
```

### Step 5: Deploy

**Via Dashboard:**
- Click **"Deploy"** after configuration

**Via CLI:**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to production
vercel --prod

# Deploy preview
vercel
```

### Step 6: Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. SSL certificates are automatically provisioned

### Vercel-Specific Features

- **Automatic Deployments**: Pushes to main branch = production, other branches = preview
- **Edge Functions**: API routes run as serverless functions
- **Analytics**: Enable in project settings
- **Logs**: View in **Deployments** → **Functions** → **Logs**

---

## cPanel Deployment

### Prerequisites
- cPanel hosting with Node.js support (Node.js Selector)
- Node.js version 20.0.0 or higher
- PostgreSQL database (cPanel PostgreSQL or external)
- FTP/SFTP or File Manager access
- SSH access (recommended)

### Step 1: Build Locally

Build the application for cPanel:

```bash
npm run build:cpanel
```

This creates a `dist/` directory with the Node.js adapter build.

### Step 2: Prepare Files for Upload

You need to upload:
- `dist/` folder (entire contents)
- `server.js` (Node.js server entry point)
- `package.json`
- `package-lock.json`
- `prisma/` folder
- `.env` file (create this, see Step 4)
- `node_modules/` (or install on server)

### Step 3: Upload to cPanel

**Option A: File Manager**
1. Log into cPanel
2. Open **File Manager**
3. Navigate to domain root (`public_html` or subdomain folder)
4. Upload all required files

**Option B: FTP/SFTP**
1. Connect via FTP/SFTP client
2. Upload files to domain root
3. Set permissions: 755 for directories, 644 for files

**Option C: Git + SSH (Recommended)**
```bash
# SSH into server
ssh user@your-server.com

# Navigate to domain directory
cd ~/public_html  # or your domain folder

# Clone repository
git clone <your-repo-url> .

# Install dependencies
npm install --production

# Build on server
npm run build:cpanel
```

### Step 4: Environment Variables

Create `.env` file in root directory:

```bash
# Database connection
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"

# JWT secret (generate strong random string)
JWT_SECRET="your-super-secret-jwt-key-change-this"

# Environment
NODE_ENV="production"

# Deployment target (optional, defaults to cpanel)
DEPLOY_TARGET="cpanel"
```

**Generate JWT_SECRET:**
```bash
openssl rand -base64 32
```

**Set secure permissions:**
```bash
chmod 600 .env
```

### Step 5: Set Up Node.js in cPanel

1. Log into cPanel
2. Navigate to **Node.js Selector** (Software section)
3. Click **Create Application**
4. Configure:
   - **Node.js version**: 20.0.0 or higher
   - **Application mode**: Production
   - **Application root**: Your domain directory (e.g., `public_html`)
   - **Application URL**: Your domain or subdomain
   - **Application startup file**: `server.js`
5. Click **Create**

### Step 6: Environment Variables in Node.js Selector

1. In Node.js Selector, click on your application
2. Go to **Environment Variables** section
3. Add:
   - `DATABASE_URL` = your database connection string
   - `JWT_SECRET` = your JWT secret
   - `NODE_ENV` = `production`
   - `PORT` = (usually auto-set)
   - `DEPLOY_TARGET` = `cpanel` (optional)
4. Click **Save**

### Step 7: Install Dependencies

**Via Node.js Selector:**
- Click **Run NPM Install** in your application

**Via SSH:**
```bash
cd /path/to/your/domain
npm install --production
```

### Step 8: Database Setup

**Option A: cPanel PostgreSQL**
1. In cPanel → **PostgreSQL Databases**
2. Create database and user
3. Grant all privileges
4. Note connection details

**Option B: External PostgreSQL**
- Use Supabase, Neon, Railway, or any PostgreSQL provider
- Get connection string and add to `.env`

### Step 9: Run Database Migrations

**Via SSH (Recommended):**
```bash
cd /path/to/your/domain

# Set DATABASE_URL (or use .env)
export DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"

# Run migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

**Via cPanel Terminal:**
- Open Terminal in cPanel
- Run the same commands

### Step 10: Start Application

**Using Node.js Selector:**
- Application should auto-start
- If not, click **Restart Application**
- Check logs for errors

**Using PM2 (Alternative):**
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start server.js --name elevateballers

# Save configuration
pm2 save

# Set to start on reboot
pm2 startup
```

### Step 11: Configure Domain & SSL

1. **Domain Configuration**
   - In cPanel → **Subdomains** or **Addon Domains**
   - Point domain to application directory

2. **SSL Certificate**
   - In cPanel → **SSL/TLS Status**
   - Install Let's Encrypt certificate
   - Force HTTPS redirect (recommended)

---

## Switching Between Deployment Targets

### Build Commands

```bash
# Build for Vercel
npm run build:vercel

# Build for cPanel
npm run build:cpanel

# Default build (uses cPanel adapter)
npm run build
```

### Environment Variable

The `DEPLOY_TARGET` environment variable controls which adapter is used:

- `DEPLOY_TARGET=vercel` → Uses `@astrojs/vercel` adapter
- `DEPLOY_TARGET=cpanel` → Uses `@astrojs/node` adapter
- Unset or any other value → Defaults to `@astrojs/node` (cPanel)

### Configuration Files

- **`vercel.json`**: Vercel-specific configuration (only used on Vercel)
- **`server.js`**: Node.js server entry point (only used on cPanel)
- **`.htaccess`**: Apache configuration for cPanel (optional)

---

## Troubleshooting

### Vercel Issues

**Build Fails:**
- Ensure `DEPLOY_TARGET=vercel` is set during build
- Check Prisma generation runs: `prisma generate`
- Verify all dependencies in `package.json`

**Database Connection Errors:**
- Verify `DATABASE_URL` is set correctly
- Check database allows Vercel IPs
- Ensure SSL is enabled if required

**Function Timeouts:**
- Increase `maxDuration` in `vercel.json` (max 60s for Hobby plan)
- Optimize database queries
- Consider caching strategies

### cPanel Issues

**Application Won't Start:**
- Check Node.js version (must be 20.0.0+)
- Verify `server.js` exists in root
- Check application logs in Node.js Selector
- Ensure dependencies installed: `npm install`
- Verify environment variables are set

**Database Connection Fails:**
- Verify `DATABASE_URL` is correct
- Check database server allows connections from hosting IP
- Ensure database user has proper permissions
- Test connection string locally first
- Add `?sslmode=require` if SSL required

**500 Internal Server Error:**
- Check application logs
- Verify Prisma Client generated: `npx prisma generate`
- Ensure all environment variables set
- Check file permissions
- Verify Node.js version compatibility

**Port Conflicts:**
- Check assigned port in Node.js Selector
- Some hosts auto-assign ports
- Update `PORT` environment variable if needed

---

## Maintenance

### Updating Application

**Vercel:**
- Push changes to Git repository
- Vercel automatically deploys
- Or manually trigger: `vercel --prod`

**cPanel:**
```bash
# Via Git
git pull
npm install
npm run build:cpanel
# Restart in Node.js Selector

# Or upload new dist/ folder via File Manager
```

### Database Migrations

**Both Platforms:**
```bash
# Set production DATABASE_URL
export DATABASE_URL="your-production-connection-string"

# Run migrations
npx prisma migrate deploy
npx prisma generate
```

### Viewing Logs

**Vercel:**
- **Deployments** → **Functions** → **Logs**
- Real-time logs during deployment

**cPanel:**
- **Node.js Selector** → Application → View logs
- **SSH**: `pm2 logs elevateballers` (if using PM2)
- Application logs in `logs/` directory

---

## Security Checklist

- [ ] `.env` file has secure permissions (600)
- [ ] `JWT_SECRET` is strong and unique
- [ ] Database credentials are secure
- [ ] SSL certificate installed and active
- [ ] Node.js version is up to date
- [ ] Dependencies are up to date (`npm audit`)
- [ ] File permissions are correct
- [ ] `.env` is in `.gitignore` (not committed)
- [ ] Environment variables are set in platform dashboard (not just `.env`)

---

## Comparison: Vercel vs cPanel

| Feature | Vercel | cPanel |
|---------|--------|--------|
| **Deployment** | Git-based, automatic | Manual upload or Git |
| **Scaling** | Automatic, serverless | Manual, requires server resources |
| **Cost** | Free tier available, pay-as-you-go | Fixed hosting cost |
| **Node.js Version** | Latest supported | Depends on host |
| **Database** | Vercel Postgres available | External or cPanel PostgreSQL |
| **SSL** | Automatic | Manual setup (Let's Encrypt) |
| **Environment Variables** | Dashboard UI | `.env` file or Node.js Selector |
| **Logs** | Built-in dashboard | Node.js Selector or SSH |
| **Custom Domain** | Easy setup | Standard DNS configuration |
| **Build Process** | Automatic on push | Manual or via Git |

---

## Additional Resources

- [Astro Deployment Guide](https://docs.astro.build/en/guides/deploy/)
- [Vercel Documentation](https://vercel.com/docs)
- [Astro Node.js Adapter](https://docs.astro.build/en/guides/integrations-guide/node/)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
- [cPanel Node.js Documentation](https://docs.cpanel.net/knowledge-base/web-services/how-to-set-up-a-node-js-application/)

---

**Need Help?**
- Check application logs for specific errors
- Verify all prerequisites are met
- Review platform-specific documentation
- Contact hosting provider support
