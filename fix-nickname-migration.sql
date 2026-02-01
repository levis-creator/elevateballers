-- Fix for failed nickname migration
-- Run this SQL in your MySQL database

-- Step 1: Check if column exists (run this first to verify)
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = DATABASE()
AND table_name = 'teams' 
AND column_name = 'nickname';

-- Step 2a: If column DOES exist, mark migration as applied:
INSERT INTO _prisma_migrations (migration_name, started_at, finished_at, applied_steps_count)
VALUES ('20260129000000_add_team_nickname', NOW(), NOW(), 1)
ON DUPLICATE KEY UPDATE finished_at = NOW(), applied_steps_count = 1;

-- Step 2b: If column DOES NOT exist, add it first:
-- ALTER TABLE `teams` ADD COLUMN `nickname` VARCHAR(191) NULL;
-- Then run Step 2a to mark migration as applied
