# Database Seeder - Admin User

This seeder creates an admin user for the Elevate Ballers application. It works in both **local development** and **cPanel production** environments.

## Quick Start

### Using Prisma Seed (Recommended)

```bash
# Run the seed script
npm run db:seed
```

Or directly with Prisma:

```bash
npx prisma db seed
```

### Using the Admin Creation Script

```bash
# Run the admin creation script
npm run create-admin
```

**Note:** The scripts now use plain JavaScript (`.js` files) instead of TypeScript, which works better in cPanel environments where `tsx` might not be available.

## Environment Variables

The seeder uses the following environment variables (all optional with defaults):

| Variable | Default | Description |
|----------|---------|-------------|
| `ADMIN_EMAIL` | `admin@elevateballers.com` | Email address for the admin user |
| `ADMIN_PASSWORD` | `admin123` | Password for the admin user |
| `ADMIN_NAME` | `Admin User` | Display name for the admin user |
| `DATABASE_URL` | **Required** | MySQL/MariaDB connection string |

### Example `.env` Configuration

```env
DATABASE_URL="mysql://user:password@localhost:3306/elevateballers"
ADMIN_EMAIL="admin@elevateballers.com"
ADMIN_PASSWORD="your-secure-password-here"
ADMIN_NAME="Admin User"
```

## Usage in Different Environments

### Local Development

1. **Set up your `.env` file:**
   ```env
   DATABASE_URL="mysql://root:password@localhost:3306/elevateballers"
   ADMIN_EMAIL="admin@elevateballers.com"
   ADMIN_PASSWORD="admin123"
   ```

2. **Run the seeder:**
   ```bash
   npm run db:seed
   ```

3. **Or use the admin script:**
   ```bash
   npm run create-admin
   ```

### cPanel Production

1. **Set environment variables in cPanel Node.js Selector:**
   - Go to **Node.js Selector** → Your Application
   - Click **Environment Variables** or **Edit** your application
   - Add environment variables:
     - `DATABASE_URL` (your MySQL connection string, e.g., `mysql://user:password@localhost:3306/database`)
     - `ADMIN_EMAIL` (optional, defaults to `admin@elevateballers.com`)
     - `ADMIN_PASSWORD` (optional, defaults to `admin123`)
     - `ADMIN_NAME` (optional, defaults to `Admin User`)
   - Click **Save**

2. **Regenerate Prisma Client (IMPORTANT - must match your database):**
   ```bash
   # Navigate to your application directory
   cd /home/username/your-domain.com
   
   # Regenerate Prisma client to match your database provider (MySQL/MariaDB)
   npx prisma generate
   ```
   
   **⚠️ Important:** If you see an error about provider mismatch (e.g., "not compatible with the provider `postgres`"), this means the Prisma client was generated with the wrong database provider. Run `npx prisma generate` to fix it.

3. **Run the seeder via SSH:**
   ```bash
   # Navigate to your application directory
   cd /home/username/your-domain.com
   
   # Make sure dependencies are installed
   npm install --legacy-peer-deps
   
   # Run the seeder (uses plain JavaScript, no TypeScript compilation needed)
   npm run db:seed
   ```

   Or use the admin script directly:
   ```bash
   cd /home/username/your-domain.com
   npm run create-admin
   ```

3. **Alternative: Run directly with Node.js (if npm scripts don't work):**
   ```bash
   cd /home/username/your-domain.com
   node prisma/seed.js
   ```
   
   Or:
   ```bash
   node scripts/create-admin.js
   ```

## Behavior

- **If admin user doesn't exist:** Creates a new admin user with the specified credentials
- **If admin user already exists:** 
  - If `ADMIN_PASSWORD` is set, updates the password
  - If `ADMIN_PASSWORD` is not set, skips creation (useful to avoid overwriting existing passwords)

## Security Notes

⚠️ **Important Security Reminders:**

1. **Change default password:** Always change the default password after first login
2. **Use strong passwords:** Set `ADMIN_PASSWORD` to a strong, unique password in production
3. **Don't commit `.env`:** Never commit `.env` files with real credentials to version control
4. **Production credentials:** Use different credentials for production than development

## Troubleshooting

### Error: DATABASE_URL not set

**Solution:** Ensure `DATABASE_URL` is set in your `.env` file or environment variables.

```bash
# Check if DATABASE_URL is set
echo $DATABASE_URL
```

### Error: Invalid DATABASE_URL format

**Solution:** Ensure your connection string follows the MySQL format:

```
mysql://username:password@host:port/database
```

Example:
```
mysql://root:mypassword@localhost:3306/elevateballers
```

### Error: Connection refused

**Solution:** 
- Verify your database server is running
- Check database credentials
- Ensure firewall allows connections
- For cPanel, verify database user has proper permissions

### Admin user already exists but password not updating

**Solution:** Set `ADMIN_PASSWORD` environment variable explicitly:

```bash
ADMIN_PASSWORD="new-password" npm run db:seed
```

### Error: Driver Adapter not compatible with provider

**Symptoms:**
```
The Driver Adapter `@prisma/adapter-mariadb`, based on `mysql`, is not compatible with the provider `postgres` specified in the Prisma schema.
```

**Solution:** The Prisma client was generated with the wrong database provider. Regenerate it:

```bash
cd /home/username/your-domain.com
npx prisma generate
```

This will regenerate the Prisma client to match your `prisma/schema.prisma` file (which should have `provider = "mysql"`).

## Files

- `prisma/seed.js` - Main Prisma seed file (JavaScript, runs via `npm run db:seed`)
- `scripts/create-admin.js` - Standalone admin creation script (JavaScript, runs via `npm run create-admin`)
- `prisma/seed.ts` - TypeScript source (for reference, not used in cPanel)
- `scripts/create-admin.ts` - TypeScript source (for reference, not used in cPanel)

**Note:** The `.js` files are used in production (including cPanel) as they don't require TypeScript compilation. The `.ts` files are kept for development reference.
