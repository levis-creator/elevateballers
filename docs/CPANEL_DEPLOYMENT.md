# cPanel Deployment Guide

Complete guide for deploying the Elevate Ballers application to cPanel hosting.

## Prerequisites

- A cPanel hosting account with Node.js support (Node.js Selector)
- Node.js version 20.0.0 or higher available in cPanel
- A PostgreSQL database (can be on the same server or external)
- FTP/SFTP access or File Manager access in cPanel
- SSH access (recommended, but not always available)

## Important Notes

⚠️ **This application requires Node.js and cannot run as a static site** because it uses:
- Server-side rendering (SSR)
- API routes (`/api/*`)
- Database connections (PostgreSQL)

If your cPanel hosting doesn't support Node.js applications, you'll need to:
1. Upgrade to a hosting plan that supports Node.js
2. Or use a different hosting provider (Vercel, Netlify, Railway, etc.)

## Quick Start

```bash
# 1. Build for cPanel
npm run build:cpanel

# 2. Upload files to cPanel (see Step 4)
# 3. Set up Node.js application in cPanel (see Step 6)
# 4. Configure environment variables (see Step 5)
# 5. Run database migrations (see Step 7)
```

## Step 1: Build Your Application Locally

Before uploading to cPanel, build your application locally using the cPanel-specific build command:

```bash
# Install dependencies (if not already done)
npm install

# Build the application for cPanel
npm run build:cpanel
```

This command:
- Sets `DEPLOY_TARGET=cpanel` to use the Node.js adapter
- Generates Prisma Client
- Builds the application with the correct adapter

This will create a `dist/` directory with your built application configured for Node.js/cPanel.

**Note:** The application is configured to automatically use the Node.js adapter when `DEPLOY_TARGET=cpanel` is set (or when `DEPLOY_TARGET` is unset). The `build:cpanel` script handles this automatically.

## Step 2: Set Up Database

### Option A: Use cPanel's PostgreSQL (if available)

1. Log into cPanel
2. Navigate to **PostgreSQL Databases**
3. Create a new database
4. Create a database user
5. Grant all privileges to the user
6. Note the connection details

The connection string format will be:
```
postgresql://username:password@localhost:5432/database_name?schema=public
```

### Option B: Use External PostgreSQL

You can use:
- **Supabase** (free tier available)
- **Neon** (free tier available)
- **Railway** (free tier available)
- **Any PostgreSQL provider**

Get your connection string in the format:
```
postgresql://username:password@host:5432/database?schema=public
```

**Important:** If your database requires SSL, add `?sslmode=require` to the connection string:
```
postgresql://username:password@host:5432/database?schema=public&sslmode=require
```

## Step 3: Prepare Files for Upload

You need to upload the following files to your cPanel domain directory:

### Required Files:
- ✅ `dist/` folder (entire contents - this is your built application)
- ✅ `server.js` (Node.js server entry point - already in your project)
- ✅ `package.json` (dependencies list)
- ✅ `package-lock.json` (dependency lock file)
- ✅ `prisma/` folder (Prisma schema and migrations)
- ✅ `.env` file (create this on the server, see Step 4)

### Optional (can install on server):
- `node_modules/` folder (or install via SSH/Node.js Selector)

## Step 4: Upload Files to cPanel

### Option A: Using File Manager (Easiest)

1. Log into cPanel
2. Open **File Manager**
3. Navigate to your domain's root directory:
   - Main domain: `public_html`
   - Subdomain: `public_html/subdomain_name` or dedicated subdomain folder
4. Upload all required files:
   - Upload `dist/` folder contents
   - Upload `server.js`
   - Upload `package.json` and `package-lock.json`
   - Upload `prisma/` folder
   - Create `.env` file (see Step 5)

### Option B: Using FTP/SFTP

1. Connect to your server via FTP/SFTP client (FileZilla, WinSCP, etc.)
2. Navigate to your domain's root directory
3. Upload all project files
4. Ensure file permissions are correct:
   - Directories: `755`
   - Files: `644`
   - `.env` file: `600` (for security)

### Option C: Using Git + SSH (Recommended for Updates)

1. SSH into your server:
   ```bash
   ssh username@your-server.com
   ```

2. Navigate to your domain directory:
   ```bash
   cd ~/public_html  # or your domain folder
   ```

3. Clone your repository (if first time):
   ```bash
   git clone <your-repo-url> .
   ```

4. Or pull latest changes (if updating):
   ```bash
   git pull
   ```

5. Install dependencies:
   ```bash
   npm install --production
   ```

6. Build on server:
   ```bash
   npm run build:cpanel
   ```

## Step 5: Configure Environment Variables

### 5.1 Create .env File

In your cPanel File Manager or via SSH, create a `.env` file in the root directory:

```bash
# Database connection string (MySQL/MariaDB format)
DATABASE_URL="mysql://user:password@host:3306/database"

# JWT secret (generate a strong random string)
JWT_SECRET="your-super-secret-jwt-key-change-this"

# Environment
NODE_ENV="production"

# Deployment target (optional - defaults to cpanel if not set)
DEPLOY_TARGET="cpanel"
```

**Important:** This project uses **MySQL/MariaDB**, not PostgreSQL. The connection string format is:
- Format: `mysql://user:password@host:port/database`
- Example: `mysql://root:password123@localhost:3306/elevateballers`
- Port: Usually `3306` for MySQL/MariaDB

**Generate JWT_SECRET:**
```bash
# On Linux/Mac
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Important Security Notes:**
- Never commit `.env` to Git (it's already in `.gitignore`)
- Use strong, unique values for `JWT_SECRET`
- Use different secrets for development and production
- Keep your `.env` file secure

### 5.2 Set File Permissions

Ensure `.env` has secure permissions (600 or 640):

**Via SSH:**
```bash
chmod 600 .env
```

**Via File Manager:**
1. Right-click on `.env` file
2. Select **Change Permissions**
3. Set to `600` (read/write for owner only)

### 5.3 Set Environment Variables in Node.js Selector

You can also set environment variables in the Node.js Selector (recommended as it's more secure):

1. In Node.js Selector, click on your application
2. Go to **Environment Variables** section
3. Add each variable:
   - `DATABASE_URL` = your database connection string
   - `JWT_SECRET` = your JWT secret
   - `NODE_ENV` = `production`
   - `DEPLOY_TARGET` = `cpanel` (optional)
   - `PORT` = (usually auto-set by cPanel, but can specify if needed)
4. Click **Save**

**Note:** Environment variables set in Node.js Selector take precedence over `.env` file.

## Step 6: Set Up Node.js in cPanel

### 6.1 Using Node.js Selector

1. Log into cPanel
2. Navigate to **Node.js Selector** (under Software section)
3. Click **Create Application**
4. Configure the application:
   - **Node.js version**: Select 20.0.0 or higher
   - **Application mode**: Production
   - **Application root**: Your domain directory (e.g., `public_html` or subdomain folder)
   - **Application URL**: Your domain or subdomain
   - **Application startup file**: `server.js`
   - **Passenger log file**: Leave default or customize
5. Click **Create**

### 6.2 Install Dependencies

If you uploaded files without `node_modules`:

**⚠️ Important:** This project has peer dependency conflicts (React 19 vs React 18). You **must** use `--legacy-peer-deps` flag when installing.

**Via Node.js Selector:**
1. In Node.js Selector, click on your application
2. **Note:** Node.js Selector's "Run NPM Install" may not support flags
3. If installation fails, use SSH method below instead

**Via SSH (Recommended):**
```bash
cd /home/elevateb/test.dev
npm install --production --legacy-peer-deps
```

**Alternative (if you need dev dependencies for seeding/admin scripts):**
```bash
cd /home/elevateb/test.dev
npm install --legacy-peer-deps
```

**Note:** If you need to run seeders (`npm run db:seed` or `npm run create-admin`), you'll need dev dependencies installed because `tsx` is a dev dependency. Use the alternative command above.

**Why `--legacy-peer-deps`?**
- The project uses React 19.2.3, but `@g-loot/react-tournament-brackets` requires React 18.1.0
- This is a peer dependency warning, not a breaking error
- The `--legacy-peer-deps` flag tells npm to ignore peer dependency conflicts
- Your application will work fine - React 19 is backward compatible

**Note:** 
- Use `--production` flag to skip dev dependencies and reduce installation time
- Always use `--legacy-peer-deps` for this project to avoid installation errors

## Step 7: Run Database Migrations

Before starting your application, you need to run database migrations to set up your database schema.

### Option A: Via SSH (Recommended)

```bash
# SSH into your server
ssh username@your-server.com

# Navigate to your domain directory
cd /path/to/your/domain

# Set DATABASE_URL (if not using .env)
export DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"

# Run migrations
npx prisma migrate deploy

# Generate Prisma Client (if not already generated)
npx prisma generate
```

### Option B: Via cPanel Terminal

1. Open **Terminal** in cPanel
2. Navigate to your domain directory:
   ```bash
   cd ~/public_html  # or your domain folder
   ```
3. Run the same commands as above

**Important:** 
- Run migrations **before** starting the application
- The `migrate deploy` command applies pending migrations without creating new ones
- This is safe to run multiple times

## Step 8: Start Your Application

### Using Node.js Selector (Recommended)

1. In Node.js Selector, your application should auto-start after creation
2. If not started, click **Restart Application**
3. Check the logs to ensure it started successfully:
   - Click on your application
   - View logs to see startup messages
   - Look for: `Server running on port XXXX`

### Using SSH/PM2 (Alternative)

If Node.js Selector doesn't work or you prefer PM2 for process management:

```bash
# Install PM2 globally (if not already installed)
npm install -g pm2

# Navigate to your application directory
cd /path/to/your/domain

# Start your application
pm2 start server.js --name elevateballers

# Save PM2 configuration
pm2 save

# Set PM2 to start on server reboot
pm2 startup
```

**PM2 Commands:**
- `pm2 list` - View running processes
- `pm2 logs elevateballers` - View logs
- `pm2 restart elevateballers` - Restart application
- `pm2 stop elevateballers` - Stop application

## Step 9: Configure Domain and SSL

### 9.1 Point Domain to Application

If using a subdomain or custom domain:

1. In cPanel, go to **Subdomains** or **Addon Domains**
2. Point the domain to your application directory
3. Ensure DNS records are configured correctly:
   - A record pointing to your server IP
   - Or CNAME record if using a subdomain

### 9.2 Set Up SSL Certificate

1. In cPanel, go to **SSL/TLS Status**
2. Select your domain
3. Install a free SSL certificate via **Let's Encrypt**:
   - Click **Run AutoSSL** (automatic)
   - Or manually install Let's Encrypt certificate
4. Force HTTPS redirect (recommended):
   - Go to **Force HTTPS Redirect** in SSL/TLS Status
   - Enable for your domain

## Step 10: Verify Deployment

1. **Visit your domain** in a browser
2. **Check that the homepage loads** correctly
3. **Test API endpoints** (e.g., `/api/feature-flags`)
4. **Test database connections** by using features that require database access
5. **Check application logs**:
   - In Node.js Selector → View logs
   - Or via SSH: `pm2 logs elevateballers` (if using PM2)

## Troubleshooting

### Issue: Application won't start

**Symptoms:**
- Application shows as stopped in Node.js Selector
- Error messages in logs
- 502 Bad Gateway error

**Solutions:**
- ✅ Check Node.js version (must be 20.0.0+)
- ✅ Verify `server.js` exists and is in the root directory
- ✅ Check application logs in Node.js Selector for specific errors
- ✅ Ensure all dependencies are installed (`npm install`)
- ✅ Verify environment variables are set correctly
- ✅ Check file permissions (directories: 755, files: 644)
- ✅ Verify `dist/server/entry.mjs` exists (build completed successfully)

### Issue: Database connection fails

**Symptoms:**
- Database connection errors in logs
- 500 errors when accessing database-dependent features

**Solutions:**
- ✅ Verify `DATABASE_URL` is correct (check for typos)
- ✅ Check database server allows connections from your hosting IP
- ✅ Ensure database user has proper permissions
- ✅ Test connection string locally first
- ✅ Check if SSL is required (add `?sslmode=require` to connection string)
- ✅ Verify database server is running and accessible
- ✅ Check firewall settings on database server

### Issue: 500 Internal Server Error on `/admin/login`

**Symptoms:**
- HTTP 500 error when accessing `/admin/login`
- "This page isn't working" error page
- Server logs show Prisma or database connection errors

**Most Common Causes:**
1. **`DATABASE_URL` not set** in cPanel environment variables
2. **`DATABASE_URL` using PostgreSQL format** instead of MySQL format
3. **Prisma Client not generated** on the server
4. **Database connection failing** (wrong credentials, host, or port)

**Solutions:**

**Step 1: Verify DATABASE_URL is set**
```bash
# Via SSH, check if DATABASE_URL is set
echo $DATABASE_URL

# Or check in Node.js Selector → Environment Variables
```

**Step 2: Verify DATABASE_URL format (MySQL, not PostgreSQL)**
```bash
# ✅ CORRECT (MySQL format):
DATABASE_URL="mysql://user:password@host:3306/database"

# ❌ WRONG (PostgreSQL format - will cause errors):
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
```

**Step 3: Set DATABASE_URL in cPanel**
1. Go to **Node.js Selector** → Your Application
2. Click **Environment Variables**
3. Add/Update `DATABASE_URL`:
   - **Name**: `DATABASE_URL`
   - **Value**: `mysql://your_user:your_password@your_host:3306/your_database`
   - Example: `mysql://root:password123@localhost:3306/elevateballers`
4. Click **Save**

**Step 4: Generate Prisma Client**
```bash
# Via SSH
cd /home/elevateb/test.dev  # or your domain directory
npx prisma generate
```

**Step 5: Check Server Logs**
- In Node.js Selector → Your Application → **View Logs**
- Look for errors mentioning:
  - `DATABASE_URL environment variable is not set`
  - `Invalid DATABASE_URL format`
  - `ECONNREFUSED` or connection errors
  - `Prisma Client` errors

**Step 6: Test Database Connection**
```bash
# Via SSH, test the connection string
export DATABASE_URL="mysql://user:password@host:3306/database"
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => console.log('Connected!')).catch(e => console.error('Error:', e))"
```

**Step 7: Restart Application**
- In Node.js Selector → Click **Restart Application**
- Check logs again after restart

### Issue: 500 Internal Server Error (General)

**Symptoms:**
- All pages return 500 error
- No specific error message

**Solutions:**
- ✅ Check application logs for specific error messages
- ✅ Verify Prisma Client is generated: `npx prisma generate`
- ✅ Ensure all environment variables are set (especially `DATABASE_URL` and `JWT_SECRET`)
- ✅ Check file permissions
- ✅ Verify Node.js version compatibility
- ✅ Ensure `dist/` folder is uploaded completely
- ✅ Check that `server.js` can access `dist/server/entry.mjs`

### Issue: Port conflicts

**Symptoms:**
- Application fails to start
- "Port already in use" error

**Solutions:**
- ✅ Check what port your application is using (check logs)
- ✅ Ensure the port is available
- ✅ Some cPanel hosts auto-assign ports - check Node.js Selector settings
- ✅ Update `PORT` environment variable if needed
- ✅ Check if another application is using the same port

### Issue: Build fails locally

**Symptoms:**
- `npm run build:cpanel` fails
- TypeScript or compilation errors

**Solutions:**
- ✅ Ensure Node.js 20+ is installed locally
- ✅ Check that all dependencies are in `package.json`
- ✅ Run `npm install` before building
- ✅ Check for TypeScript errors: `npm run build` (without cpanel flag first)
- ✅ Verify Prisma schema is valid: `npx prisma validate`
- ✅ Check for missing environment variables during build
- ✅ Clear `.astro` cache and rebuild

### Issue: Prisma errors

**Symptoms:**
- "Prisma Client not generated" errors
- Database query failures

**Solutions:**
- ✅ Run `npx prisma generate` on the server
- ✅ Verify `prisma/` folder is uploaded
- ✅ Check `DATABASE_URL` is set correctly
- ✅ Ensure Prisma schema is valid
- ✅ Run migrations: `npx prisma migrate deploy`

### Issue: npm install fails with peer dependency errors

**Symptoms:**
- `ERESOLVE could not resolve` errors
- `Conflicting peer dependency: react@18.3.1` errors
- Installation fails in cPanel

**Solutions:**
- ✅ Use `--legacy-peer-deps` flag: `npm install --production --legacy-peer-deps`
- ✅ This is safe - React 19 is backward compatible with React 18 components
- ✅ The conflict is from `@g-loot/react-tournament-brackets` requiring React 18
- ✅ Your application uses React 19, which works fine with React 18 peer dependencies
- ✅ If using Node.js Selector's "Run NPM Install", use SSH instead to add the flag

## Maintenance

### Updating Your Application

**Method 1: Via Git (Recommended)**

```bash
# SSH into server
ssh username@your-server.com

# Navigate to application directory
cd /path/to/your/domain

# Pull latest changes
git pull

# Install any new dependencies
npm install --production

# Build application
npm run build:cpanel

# Restart application
# In Node.js Selector: Click "Restart Application"
# Or with PM2: pm2 restart elevateballers
```

**Method 2: Manual Upload**

1. Make changes locally
2. Build: `npm run build:cpanel`
3. Upload new `dist/` folder to cPanel (replace existing)
4. Restart application in Node.js Selector

### Database Migrations

When you need to run new migrations:

```bash
# SSH into server
cd /path/to/your/domain

# Set DATABASE_URL if not in .env
export DATABASE_URL="your-connection-string"

# Run migrations
npx prisma migrate deploy

# Generate Prisma Client (if schema changed)
npx prisma generate
```

**Important:** Always backup your database before running migrations in production!

### Viewing Logs

**Node.js Selector:**
- Click on your application in Node.js Selector
- Click **View logs** or **View error logs**

**SSH/PM2:**
```bash
# If using PM2
pm2 logs elevateballers

# View last 100 lines
pm2 logs elevateballers --lines 100

# Follow logs in real-time
pm2 logs elevateballers --follow
```

**Application logs:**
- Usually in `logs/` directory
- Or as configured in Node.js Selector

### Updating Dependencies

```bash
# SSH into server
cd /path/to/your/domain

# Update package.json locally first, then:
npm install --production

# Restart application
```

## Security Checklist

Before going live, ensure:

- [ ] `.env` file has secure permissions (600)
- [ ] `JWT_SECRET` is strong and unique (not the example value)
- [ ] Database credentials are secure
- [ ] SSL certificate is installed and active
- [ ] HTTPS redirect is enabled
- [ ] Node.js version is up to date
- [ ] Dependencies are up to date (`npm audit`)
- [ ] File permissions are correct (directories: 755, files: 644)
- [ ] `.env` is in `.gitignore` (not committed to Git)
- [ ] Environment variables are set in Node.js Selector (more secure than `.env` file)
- [ ] Database allows connections only from necessary IPs
- [ ] Regular backups are configured

## Performance Optimization

### Enable Gzip Compression

In cPanel, you can enable Gzip compression via:
1. **Optimize Website** → Enable compression
2. Or add to `.htaccess` (if using Apache)

### Caching

Consider implementing:
- Browser caching for static assets
- Database query caching
- Application-level caching for frequently accessed data

### Monitoring

- Set up uptime monitoring
- Monitor application logs regularly
- Use PM2 monitoring: `pm2 monit`
- Check server resources in cPanel

## Additional Resources

- [Full Deployment Guide](./DEPLOYMENT_GUIDE.md) - Covers both Vercel and cPanel
- [Deployment Quick Reference](./DEPLOYMENT_QUICK_REFERENCE.md) - Quick commands
- [Astro Node.js Adapter Documentation](https://docs.astro.build/en/guides/integrations-guide/node/)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
- [cPanel Node.js Documentation](https://docs.cpanel.net/knowledge-base/web-services/how-to-set-up-a-node-js-application/)

## Getting Help

If you encounter issues:

1. **Check application logs** for specific error messages
2. **Verify all prerequisites** are met
3. **Review this guide** step by step
4. **Check Node.js Selector logs** in cPanel
5. **Contact your hosting provider** if Node.js Selector is not available or not working
6. **Review platform-specific documentation** (links above)

---

**Last Updated:** January 2025

**Note:** This guide assumes you're using the dual-deployment configuration. The application automatically uses the Node.js adapter when `DEPLOY_TARGET=cpanel` is set (or when unset). Use `npm run build:cpanel` to build for cPanel deployment.
