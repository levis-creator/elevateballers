-- Store sent reply body, unsent draft, and soft-delete (trash) timestamp
ALTER TABLE `contact_messages`
  ADD COLUMN `reply_body` TEXT NULL,
  ADD COLUMN `draft_reply` TEXT NULL,
  ADD COLUMN `trashed_at` DATETIME(3) NULL;

CREATE INDEX `contact_messages_trashed_at_idx` ON `contact_messages`(`trashed_at`);
