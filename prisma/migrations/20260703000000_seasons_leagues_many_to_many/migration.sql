-- Promotes Season to a top-level entity shared across leagues (many-to-many).
--
-- Before: each season had a required `league_id` (one league per season).
-- After:  a `league_seasons` join links many leagues <-> many seasons, and a
--         season survives deletion of any single league. Team rosters
--         (`season_teams`) gain `league_id` so a team joins a specific
--         (league, season) pair. Season slug becomes globally unique.
--
-- Strategy: expand (add new structures) -> backfill from the old `league_id`
-- -> contract (drop the old column/constraints). Backfill runs before the
-- NOT NULL / drop steps so no existing row is lost.

-- 1. Join table (expand)
CREATE TABLE `league_seasons` (
    `league_id` VARCHAR(191) NOT NULL,
    `season_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `league_seasons_season_id_idx`(`season_id`),
    PRIMARY KEY (`league_id`, `season_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Backfill: every existing season keeps its current league as a link row.
INSERT INTO `league_seasons` (`league_id`, `season_id`, `created_at`)
SELECT `league_id`, `id`, CURRENT_TIMESTAMP(3) FROM `seasons`;

-- 2. season_teams gains league_id (expand + backfill + enforce)
ALTER TABLE `season_teams` ADD COLUMN `league_id` VARCHAR(191) NULL;

UPDATE `season_teams` `st`
JOIN `seasons` `s` ON `st`.`season_id` = `s`.`id`
SET `st`.`league_id` = `s`.`league_id`;

ALTER TABLE `season_teams` MODIFY COLUMN `league_id` VARCHAR(191) NOT NULL;
CREATE INDEX `season_teams_league_id_idx` ON `season_teams`(`league_id`);

-- 3. Foreign keys for the new structures
ALTER TABLE `league_seasons` ADD CONSTRAINT `league_seasons_league_id_fkey` FOREIGN KEY (`league_id`) REFERENCES `leagues`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `league_seasons` ADD CONSTRAINT `league_seasons_season_id_fkey` FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `season_teams` ADD CONSTRAINT `season_teams_league_id_fkey` FOREIGN KEY (`league_id`) REFERENCES `leagues`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. Drop the old single-league link on seasons (contract)
ALTER TABLE `seasons` DROP FOREIGN KEY `seasons_league_id_fkey`;
DROP INDEX `seasons_league_id_slug_key` ON `seasons`;
DROP INDEX `seasons_league_id_idx` ON `seasons`;
DROP INDEX `seasons_slug_idx` ON `seasons`;
ALTER TABLE `seasons` DROP COLUMN `league_id`;

-- 5. De-duplicate any seasons sharing a slug (older data allowed the same slug
--    under different leagues) so the global unique index can be created. Keeps
--    the earliest row's slug and suffixes the rest with their id. No-op when
--    slugs are already unique (e.g. production).
UPDATE `seasons` `s`
JOIN (
    SELECT `slug`, MIN(`id`) AS `keep_id`
    FROM `seasons`
    GROUP BY `slug`
    HAVING COUNT(*) > 1
) `dup` ON `s`.`slug` = `dup`.`slug` AND `s`.`id` <> `dup`.`keep_id`
SET `s`.`slug` = CONCAT(`s`.`slug`, '-', `s`.`id`);

-- 6. Season slug is now globally unique
CREATE UNIQUE INDEX `seasons_slug_key` ON `seasons`(`slug`);
