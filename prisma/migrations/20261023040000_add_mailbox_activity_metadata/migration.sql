ALTER TABLE `contact_messages`
  ADD COLUMN `direction` VARCHAR(191) NOT NULL DEFAULT 'INBOUND',
  ADD COLUMN `folder` VARCHAR(191) NOT NULL DEFAULT 'INBOX',
  ADD COLUMN `starred` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `spam_at` DATETIME(3) NULL,
  ADD COLUMN `sent_at` DATETIME(3) NULL,
  ADD COLUMN `thread_id` VARCHAR(191) NULL,
  ADD COLUMN `imap_uid` INTEGER NULL,
  ADD COLUMN `imap_folder` VARCHAR(191) NULL;

CREATE INDEX `contact_messages_folder_idx` ON `contact_messages`(`folder`);
CREATE INDEX `contact_messages_direction_idx` ON `contact_messages`(`direction`);
CREATE INDEX `contact_messages_thread_id_idx` ON `contact_messages`(`thread_id`);
CREATE INDEX `contact_messages_imap_folder_imap_uid_idx` ON `contact_messages`(`imap_folder`, `imap_uid`);
