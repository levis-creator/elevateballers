# Quick Fix: Apply Nickname Migration

## The Problem
- Prisma migrate deploy fails with EAGAIN error
- npm install fails due to React peer dependency conflicts

## ✅ Solution: Run SQL Directly (Fastest)

Since this is a simple one-column migration, just run the SQL directly:

### Via MySQL Command Line (SSH)

```bash
mysql -u elevateb_test -p elevateb_test -e "ALTER TABLE teams ADD COLUMN nickname VARCHAR(191) NULL;"
```

Enter your MySQL password when prompted.

### Via phpMyAdmin (Easiest)

1. Log into **cPanel**
2. Open **phpMyAdmin**
3. Select database: `elevateb_test`
4. Click **SQL** tab
5. Paste this SQL:

```sql
ALTER TABLE `teams` ADD COLUMN `nickname` VARCHAR(191) NULL;
```

6. Click **Go**

### Verify It Worked

```sql
DESCRIBE teams;
```

You should see `nickname` in the column list.

## After Running SQL

1. **Regenerate Prisma Client** (use legacy peer deps to avoid React conflicts):

```bash
npm install prisma @prisma/client --legacy-peer-deps
npx prisma generate
```

Or if that still fails, just regenerate:

```bash
npx prisma generate --legacy-peer-deps
```

2. **Restart your application**

3. **Test** - The nickname field should now appear in the team editor form

## Alternative: Fix npm Install Issue

If you need to reinstall Prisma packages, use:

```bash
npm install prisma @prisma/client --legacy-peer-deps
```

The `--legacy-peer-deps` flag ignores the React version conflict (which is safe since Prisma doesn't actually depend on React).

## Why This Works

- The migration is just adding one column
- Running SQL directly bypasses Prisma engine issues
- No need to fix npm/Prisma engine problems for this simple change
- You can fix Prisma later if needed, but the migration will already be applied
