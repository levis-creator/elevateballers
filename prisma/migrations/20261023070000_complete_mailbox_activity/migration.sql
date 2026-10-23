ALTER TABLE `contact_messages`
  ADD COLUMN `delivery_status` VARCHAR(191) NOT NULL DEFAULT 'RECEIVED',
  ADD COLUMN `provider_id` VARCHAR(191) NULL,
  ADD COLUMN `failure_reason` TEXT NULL,
  ADD COLUMN `archived_at` DATETIME(3) NULL,
  ADD COLUMN `in_reply_to` VARCHAR(191) NULL,
  ADD COLUMN `references` TEXT NULL;

CREATE INDEX `contact_messages_delivery_status_idx` ON `contact_messages`(`delivery_status`);
CREATE INDEX `contact_messages_archived_at_idx` ON `contact_messages`(`archived_at`);
CREATE INDEX `contact_messages_in_reply_to_idx` ON `contact_messages`(`in_reply_to`);
