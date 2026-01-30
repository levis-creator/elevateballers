# Apply Team Nickname Migration

## Problem
If `npx prisma migrate deploy` fails with EAGAIN error on cPanel, run the migration SQL directly.

## Solution 1: Run SQL Directly via MySQL Command Line (Recommended)

SSH into your cPanel server and run:

```bash
mysql -u elevateb_test -p elevateb_test < /path/to/migration.sql
```

Or connect interactively:

```bash
mysql -u elevateb_test -p elevateb_test
```

Then paste and run:

```sql
ALTER TABLE `teams` ADD COLUMN `nickname` VARCHAR(191) NULL;
```

## Solution 2: Use phpMyAdmin

1. Log into cPanel
2. Open **phpMyAdmin**
3. Select database: `elevateb_test`
4. Click **SQL** tab
5. Paste this SQL:

```sql
ALTER TABLE `teams` ADD COLUMN `nickname` VARCHAR(191) NULL;
```

6. Click **Go**

## Solution 3: Fix Prisma Engine Issue

If you want to fix the Prisma issue:

### Check Binary Permissions
```bash
ls -la /home/elevateb/nodevenv/test.dev/20/lib/node_modules/@prisma/engines/schema-engine-debian-openssl-1.0.x
chmod +x /home/elevateb/nodevenv/test.dev/20/lib/node_modules/@prisma/engines/schema-engine-debian-openssl-1.0.x
```

### Reinstall Prisma
```bash
cd /path/to/your/app
npm uninstall prisma @prisma/client
npm install prisma @prisma/client --save
npx prisma generate
```

### Check System Resources
```bash
# Check available memory
free -h

# Check disk space
df -h

# Check process limits
ulimit -a
```

## Solution 4: Use Prisma DB Push (Alternative)

Instead of migrate deploy, try:

```bash
npx prisma db push
```

This syncs your schema without using migrations.

## Verify Migration

After applying the migration, verify it worked:

```sql
DESCRIBE teams;
```

Or:

```sql
SHOW COLUMNS FROM teams LIKE 'nickname';
```

You should see the `nickname` column listed.

## After Migration

1. Regenerate Prisma Client:
   ```bash
   npx prisma generate
   ```

2. Restart your application

3. Test the nickname field in the admin panel
