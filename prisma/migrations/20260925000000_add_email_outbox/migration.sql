CREATE TABLE `email_outbox` (
    `id` VARCHAR(191) NOT NULL,
    `payload` JSON NOT NULL,
    `source` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `last_error` TEXT NULL,
    `next_attempt_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `locked_until` DATETIME(3) NULL,
    `sent_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `email_outbox_status_next_attempt_at_idx`(`status`, `next_attempt_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
