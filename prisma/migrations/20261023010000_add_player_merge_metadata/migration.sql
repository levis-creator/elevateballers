ALTER TABLE `players` ADD COLUMN `merged_into_id` VARCHAR(191) NULL;
ALTER TABLE `players` ADD COLUMN `merged_at` DATETIME(3) NULL;
ALTER TABLE `players` ADD COLUMN `merged_by_id` VARCHAR(191) NULL;
CREATE INDEX `players_merged_into_id_idx` ON `players`(`merged_into_id`);
