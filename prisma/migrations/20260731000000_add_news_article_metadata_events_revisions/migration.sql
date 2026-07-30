CREATE TABLE `news_article_metadata` (
  `id` VARCHAR(191) NOT NULL,
  `article_id` VARCHAR(191) NOT NULL,
  `seo_title` VARCHAR(191) NULL,
  `seo_description` VARCHAR(191) NULL,
  `canonical_url` VARCHAR(191) NULL,
  `social_title` VARCHAR(191) NULL,
  `social_description` VARCHAR(191) NULL,
  `social_image` VARCHAR(191) NULL,
  `image_alt` VARCHAR(191) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `news_article_metadata_article_id_key` (`article_id`),
  CONSTRAINT `news_article_metadata_article_id_fkey` FOREIGN KEY (`article_id`) REFERENCES `news_articles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `news_article_events` (
  `id` VARCHAR(191) NOT NULL,
  `article_id` VARCHAR(191) NOT NULL,
  `type` ENUM('VIEW', 'SHARE', 'COPY_LINK', 'COMMENT') NOT NULL,
  `session_id` VARCHAR(191) NULL,
  `user_id` VARCHAR(191) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `news_article_events_article_id_type_idx` (`article_id`, `type`),
  INDEX `news_article_events_article_id_created_at_idx` (`article_id`, `created_at`),
  CONSTRAINT `news_article_events_article_id_fkey` FOREIGN KEY (`article_id`) REFERENCES `news_articles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `news_article_revisions` (
  `id` VARCHAR(191) NOT NULL,
  `article_id` VARCHAR(191) NOT NULL,
  `version` INTEGER NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `content` LONGTEXT NOT NULL,
  `excerpt` VARCHAR(191) NULL,
  `category` ENUM('INTERVIEWS', 'CHAMPIONSHIPS', 'MATCH_REPORT', 'ANALYSIS') NOT NULL,
  `image` VARCHAR(191) NULL,
  `published` BOOLEAN NOT NULL,
  `feature` BOOLEAN NOT NULL,
  `published_at` DATETIME(3) NULL,
  `changed_by_id` VARCHAR(191) NULL,
  `change_note` VARCHAR(191) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `news_article_revisions_article_id_version_key` (`article_id`, `version`),
  INDEX `news_article_revisions_article_id_created_at_idx` (`article_id`, `created_at`),
  CONSTRAINT `news_article_revisions_article_id_fkey` FOREIGN KEY (`article_id`) REFERENCES `news_articles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `news_article_revisions_changed_by_id_fkey` FOREIGN KEY (`changed_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
