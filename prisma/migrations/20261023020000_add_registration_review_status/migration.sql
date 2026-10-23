ALTER TABLE `players` ADD COLUMN `review_status` VARCHAR(191) NULL;
ALTER TABLE `teams` ADD COLUMN `review_status` VARCHAR(191) NULL;
CREATE INDEX `players_review_status_idx` ON `players`(`review_status`);
CREATE INDEX `teams_review_status_idx` ON `teams`(`review_status`);
