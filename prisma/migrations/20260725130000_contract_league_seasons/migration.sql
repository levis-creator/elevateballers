-- Phase 6: contract the transitional LeagueSeason model after the Phase 3
-- backfill and Phase 4/5 application cutover.
--
-- The guard is intentionally first. It makes this migration fail closed before
-- any structural change when legacy or inconsistent rows remain.
CREATE TEMPORARY TABLE `_phase6_league_season_guard` (
    `violations` BIGINT NOT NULL,
    CONSTRAINT `_phase6_requires_clean_backfill` CHECK (`violations` = 0)
);

INSERT INTO `_phase6_league_season_guard` (`violations`)
SELECT
    (SELECT COUNT(*) FROM `league_seasons`
        WHERE `id` IS NULL OR `start_date` IS NULL OR `end_date` IS NULL)
  + (SELECT COUNT(*) FROM `conferences` WHERE `league_season_id` IS NULL)
  + (SELECT COUNT(*) FROM `season_teams` WHERE `league_season_id` IS NULL)
  + (SELECT COUNT(*) FROM `matches`
        WHERE `season_id` IS NOT NULL AND `league_season_id` IS NULL)
  + (SELECT COUNT(*)
       FROM `conferences` `c`
       JOIN `league_seasons` `ls` ON `ls`.`id` = `c`.`league_season_id`
       WHERE `c`.`season_id` <> `ls`.`season_id`)
  + (SELECT COUNT(*)
       FROM `season_teams` `st`
       JOIN `league_seasons` `ls` ON `ls`.`id` = `st`.`league_season_id`
       WHERE `st`.`season_id` <> `ls`.`season_id`
          OR `st`.`league_id` <> `ls`.`league_id`)
  + (SELECT COUNT(*)
       FROM `matches` `m`
       JOIN `league_seasons` `ls` ON `ls`.`id` = `m`.`league_season_id`
       WHERE (`m`.`season_id` IS NOT NULL AND `m`.`season_id` <> `ls`.`season_id`)
          OR (`m`.`league_id` IS NOT NULL AND `m`.`league_id` <> `ls`.`league_id`));

DROP TEMPORARY TABLE `_phase6_league_season_guard`;

-- Make the stable identifier authoritative while retaining the natural pair as
-- a unique business key for idempotent upserts.
ALTER TABLE `league_seasons`
    DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `start_date` DATETIME(3) NOT NULL,
    MODIFY `end_date` DATETIME(3) NOT NULL,
    ADD PRIMARY KEY (`id`),
    ADD UNIQUE INDEX `league_seasons_league_id_season_id_key` (`league_id`, `season_id`);
ALTER TABLE `league_seasons`
    DROP INDEX `league_seasons_id_key`;

-- Conferences and participants cannot exist outside a competition edition.
ALTER TABLE `conferences`
    DROP FOREIGN KEY `conferences_league_season_id_fkey`,
    MODIFY `league_season_id` VARCHAR(191) NOT NULL;
ALTER TABLE `conferences`
    ADD CONSTRAINT `conferences_league_season_id_fkey`
    FOREIGN KEY (`league_season_id`) REFERENCES `league_seasons`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `season_teams`
    DROP FOREIGN KEY `season_teams_league_season_id_fkey`,
    DROP INDEX `season_teams_season_id_team_id_key`,
    MODIFY `league_season_id` VARCHAR(191) NOT NULL,
    ADD UNIQUE INDEX `season_teams_league_season_id_team_id_key` (`league_season_id`, `team_id`);
ALTER TABLE `season_teams`
    ADD CONSTRAINT `season_teams_league_season_id_fkey`
    FOREIGN KEY (`league_season_id`) REFERENCES `league_seasons`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Matches remain nullable because exhibitions may be entirely unscoped and
-- deleting a competition edition must preserve historical games. Season-scoped
-- match ownership is enforced by the application resolver and the deployment
-- audit; this MariaDB version does not permit the required cross-column CHECK.
