# Deployment Quick Reference

Quick commands and checklists for deploying to Vercel and cPanel.

## Build Commands

```bash
# Build for Vercel
npm run build:vercel

# Build for cPanel
npm run build:cpanel

# Default build (cPanel/Node.js adapter)
npm run build
```

## Vercel Deployment

### First Time Setup
1. Connect repository to Vercel dashboard
2. Set environment variables in Vercel dashboard:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `NODE_ENV=production`
3. Deploy: `vercel --prod` or use dashboard

### Subsequent Deployments
```bash
# Production
vercel --prod

# Preview
vercel
```

### Environment Variables (Vercel Dashboard)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT token secret
- `NODE_ENV` - `production`
- `DEPLOY_TARGET` - `vercel` (optional, handled by build script)

## cPanel Deployment

### Build & Upload
```bash
# 1. Build locally
npm run build:cpanel

# 2. Upload to cPanel:
#    - dist/ folder
#    - server.js
#    - package.json
#    - package-lock.json
#    - prisma/ folder
#    - .env file (create on server)
```

### Setup in cPanel
1. **Node.js Selector** → Create Application
   - Node.js version: 20.0.0+
   - Startup file: `server.js`
   - Application root: your domain directory

2. **Environment Variables** (in Node.js Selector):
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `NODE_ENV=production`
   - `DEPLOY_TARGET=cpanel` (optional)

3. **Install Dependencies**:
   - Click "Run NPM Install" in Node.js Selector
   - Or via SSH: `npm install --production`

4. **Run Migrations** (via SSH):
   ```bash
   export DATABASE_URL="your-connection-string"
   npx prisma migrate deploy
   npx prisma generate
   ```

5. **Start Application**:
   - Restart in Node.js Selector
   - Or use PM2: `pm2 start server.js --name elevateballers`

## Database Migrations

```bash
# Set production DATABASE_URL
export DATABASE_URL="your-production-connection-string"

# Run migrations
npx prisma migrate deploy
npx prisma generate
```

## Environment Variables Checklist

### Required
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `JWT_SECRET` - Strong random secret (generate: `openssl rand -base64 32`)
- [ ] `NODE_ENV` - `production`

### Optional
- [ ] `DEPLOY_TARGET` - `vercel` or `cpanel` (usually handled automatically)
- [ ] `FEATURE_FLAG_*` - Feature flags as needed

## Troubleshooting Quick Fixes

### Build Fails
- **Vercel**: Check `DEPLOY_TARGET=vercel` is set (handled by `build:vercel` script)
- **cPanel**: Check `DEPLOY_TARGET=cpanel` is set (handled by `build:cpanel` script)
- Both: Ensure `prisma generate` runs (included in build scripts)

### Database Connection Fails
- Verify `DATABASE_URL` is correct
- Check database allows connections from deployment platform
- Ensure SSL enabled if required (add `?sslmode=require`)

### Application Won't Start (cPanel)
- Check Node.js version (20.0.0+)
- Verify `server.js` exists
- Check environment variables are set
- Review logs in Node.js Selector

### Function Timeouts (Vercel)
- Increase `maxDuration` in `vercel.json` (max 60s for Hobby plan)
- Optimize database queries

## File Structure

### For Vercel
- No special files needed (Git-based deployment)
- `vercel.json` configures build

### For cPanel
Required files to upload:
- `dist/` - Built application
- `server.js` - Node.js server entry
- `package.json` - Dependencies
- `package-lock.json` - Lock file
- `prisma/` - Prisma schema and migrations
- `.env` - Environment variables (create on server)
- `node_modules/` - Or install on server

## Quick Links

- [Full Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [cPanel Deployment Details](./CPANEL_DEPLOYMENT.md)
- [Vercel Deployment Details](./VERCEL_DEPLOYMENT.md)
