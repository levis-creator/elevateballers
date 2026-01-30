# Mark Migration as Applied After Running SQL Directly

## The Problem
- `prisma migrate deploy` fails with EAGAIN error (system resource issue)
- But you've already run the SQL manually
- Prisma doesn't know the migration was applied

## Solution: Mark Migration as Applied

After running the SQL directly, you need to tell Prisma that the migration was applied.

### Step 1: Run the SQL Directly

Via MySQL command line:
```bash
mysql -u elevateb_test -p elevateb_test -e "ALTER TABLE teams ADD COLUMN nickname VARCHAR(191) NULL;"
```

Or via phpMyAdmin - run:
```sql
ALTER TABLE `teams` ADD COLUMN `nickname` VARCHAR(191) NULL;
```

### Step 2: Mark Migration as Applied

Insert a record into Prisma's migrations table to mark it as applied:

```sql
INSERT INTO `_prisma_migrations` (
  `id`,
  `checksum`,
  `finished_at`,
  `migration_name`,
  `logs`,
  `rolled_back_at`,
  `started_at`,
  `applied_steps_count`
) VALUES (
  '20260129000000_add_team_nickname',
  'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',  -- This is a placeholder checksum
  NOW(),
  '20260129000000_add_team_nickname',
  NULL,
  NULL,
  NOW(),
  1
);
```

### Step 3: Verify

Check that the migration is marked as applied:

```sql
SELECT * FROM `_prisma_migrations` WHERE migration_name = '20260129000000_add_team_nickname';
```

### Alternative: Use Prisma DB Push Instead

If marking manually is too complex, you can use `db push` instead:

```bash
npx prisma db push
```

This will sync your schema without using migrations. However, it won't track the migration in the migrations table.

### Alternative: Fix the Schema Engine Issue

If you want to fix the root cause:

1. **Check binary permissions:**
```bash
ls -la /home/elevateb/nodevenv/test.dev/20/lib/node_modules/@prisma/engines/schema-engine-debian-openssl-1.0.x
chmod +x /home/elevateb/nodevenv/test.dev/20/lib/node_modules/@prisma/engines/schema-engine-debian-openssl-1.0.x
```

2. **Check system resources:**
```bash
free -h  # Check memory
df -h    # Check disk space
ulimit -a  # Check process limits
```

3. **Try with more verbose output:**
```bash
PRISMA_ENGINES_MIRROR=https://binaries.prisma.sh npx prisma migrate deploy --verbose
```

## Recommended Approach

Since you've already generated the Prisma client successfully:
1. ✅ Run the SQL directly (done)
2. ✅ Use `prisma db push` to sync schema state (simpler than manual migration tracking)
3. ✅ Or manually insert into `_prisma_migrations` table if you need migration history

The `db push` approach is simpler and will work fine for your use case.
