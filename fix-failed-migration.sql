-- Fix failed migration: 20260129000000_add_team_nickname
-- This script resolves the failed migration by marking it as applied
-- Run this SQL directly in your MySQL database

-- Step 1: Remove the failed migration record
DELETE FROM `_prisma_migrations` 
WHERE migration_name = '20260129000000_add_team_nickname';

-- Step 2: Insert it as successfully applied
-- Note: The started_at and finished_at timestamps are set to current time
INSERT INTO `_prisma_migrations` (
    id,
    checksum,
    finished_at,
    migration_name,
    logs,
    rolled_back_at,
    started_at,
    applied_steps_count
) VALUES (
    UUID(),
    'd21876d', -- This is the checksum from the original migration
    NOW(),
    '20260129000000_add_team_nickname',
    NULL,
    NULL,
    NOW(),
    1
);

-- Verify the migration is now marked as applied
SELECT * FROM `_prisma_migrations` WHERE migration_name = '20260129000000_add_team_nickname';
