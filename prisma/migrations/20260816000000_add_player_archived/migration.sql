-- AlterTable
ALTER TABLE `players` ADD COLUMN `archived` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `players_archived_idx` ON `players`(`archived`);
