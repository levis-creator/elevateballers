ALTER TABLE `news_articles` ADD COLUMN `league_season_id` VARCHAR(191) NULL;
ALTER TABLE `news_articles` ADD INDEX `news_articles_league_season_id_idx` (`league_season_id`);
ALTER TABLE `news_articles` ADD CONSTRAINT `news_articles_league_season_id_fkey` FOREIGN KEY (`league_season_id`) REFERENCES `league_seasons`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `news_article_revisions` ADD COLUMN `league_season_id` VARCHAR(191) NULL;
