-- Add reply tracking to contact_messages
ALTER TABLE `contact_messages`
  ADD COLUMN `replied_at` DATETIME(3) NULL,
  ADD COLUMN `replied_by` VARCHAR(191) NULL;

CREATE INDEX `contact_messages_replied_at_idx` ON `contact_messages`(`replied_at`);
