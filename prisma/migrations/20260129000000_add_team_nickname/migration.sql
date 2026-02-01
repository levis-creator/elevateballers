-- AlterTable
-- Add nickname column to teams table
-- Note: If column already exists, this will fail. Use the resolve script to handle that case.
ALTER TABLE `teams` ADD COLUMN `nickname` VARCHAR(191) NULL;
