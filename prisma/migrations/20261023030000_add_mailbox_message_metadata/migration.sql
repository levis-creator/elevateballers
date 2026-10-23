ALTER TABLE `contact_messages` ADD COLUMN `source` VARCHAR(191) NOT NULL DEFAULT 'CONTACT';
ALTER TABLE `contact_messages` ADD COLUMN `external_id` VARCHAR(191) NULL;
CREATE UNIQUE INDEX `contact_messages_external_id_key` ON `contact_messages`(`external_id`);
CREATE INDEX `contact_messages_source_idx` ON `contact_messages`(`source`);
