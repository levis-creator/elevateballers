-- AlterTable
ALTER TABLE `substitutions` ADD COLUMN `client_batch_id` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `substitutions_match_id_client_batch_id_idx` ON `substitutions`(`match_id`, `client_batch_id`);
