-- AlterTable
ALTER TABLE `season_teams` ADD COLUMN `conference_id` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `conferences` (
    `id` VARCHAR(191) NOT NULL,
    `season_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `conferences_season_id_idx`(`season_id`),
    UNIQUE INDEX `conferences_season_id_name_key`(`season_id`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `season_teams_conference_id_idx` ON `season_teams`(`conference_id`);

-- AddForeignKey
ALTER TABLE `conferences` ADD CONSTRAINT `conferences_season_id_fkey` FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `season_teams` ADD CONSTRAINT `season_teams_conference_id_fkey` FOREIGN KEY (`conference_id`) REFERENCES `conferences`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
