CREATE TABLE `public_registration_submissions` (
    `idempotency_key` VARCHAR(191) NOT NULL,
    `kind` VARCHAR(191) NOT NULL,
    `email_hash` VARCHAR(191) NOT NULL,
    `entity_id` VARCHAR(191) NULL,
    `response` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expires_at` DATETIME(3) NULL,
    PRIMARY KEY (`idempotency_key`),
    INDEX `public_registration_submissions_kind_created_at_idx` (`kind`, `created_at`),
    INDEX `public_registration_submissions_expires_at_idx` (`expires_at`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `public_registration_email_jobs` (
    `id` VARCHAR(191) NOT NULL,
    `submission_key` VARCHAR(191) NOT NULL,
    `job_type` VARCHAR(191) NOT NULL,
    `payload` JSON NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `locked_until` DATETIME(3) NULL,
    `sent_at` DATETIME(3) NULL,
    `last_error` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `public_registration_email_jobs_submission_key_job_type_key` (`submission_key`, `job_type`),
    INDEX `public_registration_email_jobs_status_locked_until_idx` (`status`, `locked_until`),
    CONSTRAINT `public_registration_email_jobs_submission_key_fkey`
      FOREIGN KEY (`submission_key`) REFERENCES `public_registration_submissions` (`idempotency_key`)
      ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
