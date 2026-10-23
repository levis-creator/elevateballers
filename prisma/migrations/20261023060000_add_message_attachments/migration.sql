CREATE TABLE `message_attachments` (
  `id` VARCHAR(191) NOT NULL,
  `message_id` VARCHAR(191) NOT NULL,
  `external_id` VARCHAR(191) NOT NULL,
  `filename` VARCHAR(191) NOT NULL,
  `mime_type` VARCHAR(191) NOT NULL,
  `size` INTEGER NOT NULL,
  `content_id` VARCHAR(191) NULL,
  `storage_path` VARCHAR(191) NULL,
  `scan_status` VARCHAR(191) NOT NULL DEFAULT 'PENDING_SCAN',
  `scan_reason` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  UNIQUE INDEX `message_attachments_external_id_key` (`external_id`),
  INDEX `message_attachments_message_id_idx` (`message_id`),
  INDEX `message_attachments_scan_status_idx` (`scan_status`),
  PRIMARY KEY (`id`),
  CONSTRAINT `message_attachments_message_id_fkey` FOREIGN KEY (`message_id`) REFERENCES `contact_messages` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
