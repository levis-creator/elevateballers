-- Player of the Week award slots: one active award per league season, and per
-- conference when that edition is split into conferences. Both columns are
-- nullable so awards made before slots existed are kept as history.
ALTER TABLE `player_of_the_week`
  ADD COLUMN `league_season_id` VARCHAR(191) NULL,
  ADD COLUMN `conference_id` VARCHAR(191) NULL;

CREATE INDEX `player_of_the_week_league_season_id_conference_id_active_idx` ON `player_of_the_week`(`league_season_id`, `conference_id`, `active`);
CREATE INDEX `player_of_the_week_conference_id_idx` ON `player_of_the_week`(`conference_id`);

ALTER TABLE `player_of_the_week` ADD CONSTRAINT `player_of_the_week_league_season_id_fkey` FOREIGN KEY (`league_season_id`) REFERENCES `league_seasons`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `player_of_the_week` ADD CONSTRAINT `player_of_the_week_conference_id_fkey` FOREIGN KEY (`conference_id`) REFERENCES `conferences`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
