-- Persist admin decisions about potential player duplicate matches.
CREATE TABLE `player_duplicate_reviews` (
    `id` VARCHAR(191) NOT NULL,
    `match_key` VARCHAR(191) NOT NULL,
    `resolution` VARCHAR(191) NOT NULL DEFAULT 'OPEN',
    `reviewed_by_id` VARCHAR(191) NULL,
    `reviewed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `player_duplicate_reviews_match_key_key`(`match_key`),
    INDEX `player_duplicate_reviews_resolution_idx`(`resolution`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
