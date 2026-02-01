-- Migration to update content column to LONGTEXT
-- This allows storing large article content (up to 4GB)

ALTER TABLE `news_articles` 
MODIFY COLUMN `content` LONGTEXT NOT NULL;
