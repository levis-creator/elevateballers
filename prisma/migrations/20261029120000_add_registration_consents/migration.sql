-- Privacy Policy consent given with each public team or player registration.
CREATE TABLE `registration_consents` (
    `id` VARCHAR(191) NOT NULL,
    `kind` VARCHAR(191) NOT NULL,
    `entity_id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `submission_key` VARCHAR(191) NOT NULL,
    `policy_version` VARCHAR(191) NOT NULL,
    `consent_text` TEXT NOT NULL,
    `consented_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    INDEX `registration_consents_kind_entity_id_idx` (`kind`, `entity_id`),
    INDEX `registration_consents_email_idx` (`email`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
