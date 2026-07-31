-- Allow editorial categories to be added without a Prisma enum migration.
ALTER TABLE `news_articles` MODIFY `category` VARCHAR(191) NOT NULL;
ALTER TABLE `news_article_revisions` MODIFY `category` VARCHAR(191) NOT NULL;

-- Store article tags as a JSON string array.
ALTER TABLE `news_articles` ADD COLUMN `tags` JSON NULL;
ALTER TABLE `news_article_revisions` ADD COLUMN `tags` JSON NULL;
