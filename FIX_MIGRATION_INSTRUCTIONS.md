# Fix Failed Migration: 20260129000000_add_team_nickname

## Problem
The migration failed because Prisma doesn't support MySQL `DELIMITER` statements in migration files.

## Solution

### Option 1: Mark Migration as Applied (if column already exists)

If the `nickname` column already exists in your `teams` table, run this SQL in your MySQL database:

```sql
-- Mark migration as applied
INSERT INTO _prisma_migrations (migration_name, started_at, finished_at, applied_steps_count)
VALUES ('20260129000000_add_team_nickname', NOW(), NOW(), 1)
ON DUPLICATE KEY UPDATE finished_at = NOW(), applied_steps_count = 1;
```

### Option 2: Apply Migration Manually (if column doesn't exist)

If the column doesn't exist, run this SQL:

```sql
-- Add the column
ALTER TABLE `teams` ADD COLUMN `nickname` VARCHAR(191) NULL;

-- Mark migration as applied
INSERT INTO _prisma_migrations (migration_name, started_at, finished_at, applied_steps_count)
VALUES ('20260129000000_add_team_nickname', NOW(), NOW(), 1);
```

### Option 3: Check First, Then Apply

Run this to check if the column exists:

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = DATABASE()
AND table_name = 'teams' 
AND column_name = 'nickname';
```

- **If you get a result**: Use Option 1
- **If you get no results**: Use Option 2

## After Fixing

Once you've resolved the migration, you can continue with:

```bash
npx prisma migrate dev
```

This will apply the new Phase 1 migration (`20260131125917_add_folder_and_file_tracking`).
