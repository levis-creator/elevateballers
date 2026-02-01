-- AlterTable
ALTER TABLE `media` ADD COLUMN `featured` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `media_featured_idx` ON `media`(`featured`);
