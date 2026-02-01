-- CreateTable
CREATE TABLE `folders` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `path` VARCHAR(191) NOT NULL,
    `is_private` BOOLEAN NOT NULL DEFAULT false,
    `description` VARCHAR(191) NULL,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `folders_name_key`(`name`),
    UNIQUE INDEX `folders_path_key`(`path`),
    INDEX `folders_is_private_idx`(`is_private`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `media` ADD COLUMN `file_path` VARCHAR(191) NULL,
    ADD COLUMN `folder_id` VARCHAR(191) NULL,
    ADD COLUMN `size` INT NULL,
    ADD COLUMN `original_size` INT NULL,
    ADD COLUMN `compression_ratio` DOUBLE NULL,
    ADD COLUMN `mime_type` VARCHAR(191) NULL,
    ADD COLUMN `is_private` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `uploaded_by` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `file_usages` (
    `id` VARCHAR(191) NOT NULL,
    `media_id` VARCHAR(191) NOT NULL,
    `entity_type` ENUM('PLAYER', 'TEAM', 'NEWS_ARTICLE', 'STAFF', 'LEAGUE', 'MEDIA') NOT NULL,
    `entity_id` VARCHAR(191) NOT NULL,
    `field_name` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `file_usages_media_id_idx`(`media_id`),
    INDEX `file_usages_entity_type_idx`(`entity_type`),
    INDEX `file_usages_entity_id_idx`(`entity_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `media_folder_id_idx` ON `media`(`folder_id`);

-- CreateIndex
CREATE INDEX `media_is_private_idx` ON `media`(`is_private`);

-- CreateIndex
CREATE INDEX `media_file_path_idx` ON `media`(`file_path`);

-- AddForeignKey
ALTER TABLE `media` ADD CONSTRAINT `media_folder_id_fkey` FOREIGN KEY (`folder_id`) REFERENCES `folders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `media` ADD CONSTRAINT `media_uploaded_by_fkey` FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `file_usages` ADD CONSTRAINT `file_usages_media_id_fkey` FOREIGN KEY (`media_id`) REFERENCES `media`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
