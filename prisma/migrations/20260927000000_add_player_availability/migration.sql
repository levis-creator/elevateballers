-- CreateTable
CREATE TABLE `player_availability` (
    `id` VARCHAR(191) NOT NULL,
    `player_id` VARCHAR(191) NOT NULL,
    `team_id` VARCHAR(191) NULL,
    `type` ENUM('SUSPENSION', 'INJURY') NOT NULL,
    `reason` TEXT NULL,
    `match_count` INTEGER NULL,
    `starts_after` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `source_match_id` VARCHAR(191) NULL,
    `source_event_id` VARCHAR(191) NULL,
    `created_by_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `resolved_at` DATETIME(3) NULL,
    `resolved_by_id` VARCHAR(191) NULL,

    UNIQUE INDEX `player_availability_source_event_id_key`(`source_event_id`),
    INDEX `player_availability_player_id_resolved_at_idx`(`player_id`, `resolved_at`),
    INDEX `player_availability_team_id_resolved_at_idx`(`team_id`, `resolved_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `player_availability` ADD CONSTRAINT `player_availability_player_id_fkey` FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `player_availability` ADD CONSTRAINT `player_availability_team_id_fkey` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `player_availability` ADD CONSTRAINT `player_availability_source_event_id_fkey` FOREIGN KEY (`source_event_id`) REFERENCES `match_events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
