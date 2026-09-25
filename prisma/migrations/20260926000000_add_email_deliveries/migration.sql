-- CreateTable
CREATE TABLE `email_deliveries` (
    `id` VARCHAR(191) NOT NULL,
    `idempotency_key` VARCHAR(191) NOT NULL,
    `recipient_hash` VARCHAR(64) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `email_deliveries_created_at_idx`(`created_at`),
    UNIQUE INDEX `email_deliveries_idempotency_key_recipient_hash_key`(`idempotency_key`, `recipient_hash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

