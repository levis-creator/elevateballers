# cPanel Deployment - Quick Start Checklist

Use this checklist for a quick deployment reference.

## Pre-Deployment

- [ ] Verify cPanel has Node.js Selector available
- [ ] Ensure Node.js 20.0.0+ is available
- [ ] Have PostgreSQL database ready (cPanel or external)
- [ ] Have FTP/SFTP or SSH access

## Configuration Changes Made

✅ **Already completed:**
- [x] Updated `astro.config.mjs` to use Node.js adapter
- [x] Created `server.js` entry point
- [x] Added `start` script to `package.json`

## Deployment Steps

### 1. Build Locally
```bash
npm install
npm run build
```

### 2. Upload to cPanel
Upload these files/folders:
- `dist/` (entire folder)
- `node_modules/` (or install via SSH: `npm install --production`)
- `package.json`
- `package-lock.json`
- `server.js`
- `prisma/` (entire folder)
- `.env` (create this file, see below)

### 3. Create .env File
```bash
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
JWT_SECRET="your-secret-key-here"
NODE_ENV="production"
PORT=3000
```

### 4. Set Up Node.js in cPanel
1. Go to **Node.js Selector**
2. Click **Create Application**
3. Configure:
   - Node.js version: 20.0.0+
   - Application root: Your domain directory
   - Application startup file: `server.js`
4. Add environment variables in Node.js Selector
5. Click **Run NPM Install** (if needed)
6. Click **Restart Application**

### 5. Run Database Migrations
```bash
# Via SSH or Terminal
cd /path/to/your/domain
npx prisma migrate deploy
npx prisma generate
```

### 6. Verify
- Visit your domain
- Check application logs
- Test API endpoints

## Important Files

| File | Purpose | Required |
|------|---------|----------|
| `server.js` | Node.js server entry point | ✅ Yes |
| `.env` | Environment variables | ✅ Yes |
| `dist/` | Built application | ✅ Yes |
| `node_modules/` | Dependencies | ✅ Yes |
| `package.json` | Dependencies list | ✅ Yes |
| `prisma/` | Database schema | ✅ Yes |

## Common Commands

```bash
# Install dependencies
npm install --production

# Build application
npm run build

# Start server
npm start

# Run migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

## Troubleshooting Quick Fixes

**App won't start:**
- Check Node.js version (20+)
- Verify `server.js` exists
- Check logs in Node.js Selector

**Database error:**
- Verify `DATABASE_URL` in `.env`
- Run `npx prisma generate`
- Check database permissions

**500 Error:**
- Check application logs
- Verify all environment variables
- Ensure Prisma Client is generated

---

For detailed instructions, see `CPANEL_DEPLOYMENT.md`
