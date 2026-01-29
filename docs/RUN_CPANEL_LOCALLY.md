# Running cPanel Production Build Locally

This guide shows you how to build and run the cPanel production build locally for testing.

## Quick Start

```bash
# Build and run in one command
npm run preview:cpanel
```

This will:
1. Build the application for cPanel (with Node.js adapter)
2. Start the production server on port 3000

Then open: **http://localhost:3000**

## Step-by-Step Guide

### Step 1: Set Up Environment Variables

Make sure your `.env` file has the correct database connection:

```bash
# For MySQL (current setup)
DATABASE_URL="mysql://root:admin123@localhost:3306/elevateb_test"

# Set production mode (optional)
NODE_ENV="production"
```

**Note:** You can also copy from `.env.production` if you want to test with production settings:
```bash
cp .env.production .env
```

### Step 2: Build the Application

```bash
npm run build:cpanel
```

This will:
- Set `DEPLOY_TARGET=cpanel`
- Generate Prisma Client
- Build with Node.js adapter (same as cPanel production)
- Output to `dist/` directory

### Step 3: Run the Production Server

```bash
npm run start
```

Or set a custom port:
```bash
PORT=8080 npm run start
```

The server will start on **http://localhost:3000** (or your custom PORT)

### Step 4: Test Your Application

1. Open **http://localhost:3000** in your browser
2. Test all features:
   - Homepage
   - API endpoints (`/api/*`)
   - Admin portal (`/admin/*`)
   - Database queries

## One-Command Solution

I've added a convenience script that does everything:

```bash
npm run preview:cpanel
```

This builds and starts the server in one command.

## Environment Variables

The application will use:
- `.env` file (if exists)
- Environment variables set in your shell
- Defaults (if not set)

**Important variables:**
- `DATABASE_URL` - Your MySQL connection string
- `JWT_SECRET` - Secret for JWT tokens
- `NODE_ENV` - Set to `production` for production-like behavior
- `PORT` - Server port (default: 3000)

## Differences from Development Mode

| Aspect | Development (`npm run dev`) | Production (`npm run preview:cpanel`) |
|--------|----------------------------|--------------------------------------|
| Adapter | Vercel adapter (dev mode) | Node.js adapter (production) |
| Build | No build, runs from source | Pre-built from `dist/` |
| Hot Reload | ✅ Yes | ❌ No (must rebuild) |
| Performance | Slower (dev mode) | Faster (optimized) |
| Port | 4321 | 3000 |

## Troubleshooting

### Port Already in Use

If port 3000 is already in use:
```bash
PORT=8080 npm run start
```

### Database Connection Errors

1. Make sure MySQL is running
2. Verify `DATABASE_URL` in `.env` is correct
3. Check database credentials
4. Ensure database exists

### Build Errors

```bash
# Clean and rebuild
rm -rf dist node_modules/.vite
npm run build:cpanel
```

### Module Not Found Errors

```bash
# Regenerate Prisma Client
npx prisma generate

# Rebuild
npm run build:cpanel
```

## Comparison with cPanel Production

This local setup uses the **exact same**:
- ✅ Node.js adapter (`@astrojs/node`)
- ✅ Server entry point (`server.js`)
- ✅ Build output structure (`dist/`)
- ✅ Runtime environment (Node.js)

The only differences:
- Runs on your local machine instead of cPanel server
- Uses your local `.env` instead of cPanel environment variables
- Uses your local database instead of production database

## Next Steps

After testing locally:
1. ✅ Verify everything works
2. ✅ Test all features
3. ✅ Check for errors
4. ✅ Build for deployment: `npm run build:cpanel`
5. ✅ Upload to cPanel (see `CPANEL_DEPLOYMENT.md`)
