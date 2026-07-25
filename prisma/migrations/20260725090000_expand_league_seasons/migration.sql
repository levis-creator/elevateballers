-- Phase 2: expand LeagueSeason into the future competition-edition aggregate.
--
-- This migration is intentionally additive:
--   * legacy season_id / league_id relationships remain authoritative;
--   * existing league_seasons keep their composite primary key;
--   * new identifiers, operational dates, and foreign keys are nullable until
--     the Phase 3 backfill has populated and verified every row.

-- Expand league_seasons. Prisma generates cuid values in application writes,
-- but existing rows receive ids during the explicit Phase 3 backfill.
ALTER TABLE `league_seasons`
    ADD COLUMN `id` VARCHAR(191) NULL,
    ADD COLUMN `start_date` DATETIME(3) NULL,
    ADD COLUMN `end_date` DATETIME(3) NULL,
    ADD COLUMN `registration_opens_at` DATETIME(3) NULL,
    ADD COLUMN `registration_closes_at` DATETIME(3) NULL,
    ADD COLUMN `status` ENUM(
        'DRAFT',
        'REGISTRATION',
        'SCHEDULED',
        'ACTIVE',
        'PLAYOFFS',
        'COMPLETED'
    ) NOT NULL DEFAULT 'DRAFT',
    ADD COLUMN `competition_structure` ENUM(
        'SINGLE_TABLE',
        'CONFERENCES'
    ) NOT NULL DEFAULT 'SINGLE_TABLE',
    ADD COLUMN `bracket_type` VARCHAR(191) NULL;

CREATE UNIQUE INDEX `league_seasons_id_key` ON `league_seasons`(`id`);
CREATE INDEX `league_seasons_status_idx` ON `league_seasons`(`status`);
CREATE INDEX `league_seasons_start_date_idx` ON `league_seasons`(`start_date`);
CREATE INDEX `league_seasons_end_date_idx` ON `league_seasons`(`end_date`);

-- Add nullable links from the future aggregate children. These columns are
-- backfilled in Phase 3; no existing row is modified in this migration.
ALTER TABLE `conferences`
    ADD COLUMN `league_season_id` VARCHAR(191) NULL;

ALTER TABLE `season_teams`
    ADD COLUMN `league_season_id` VARCHAR(191) NULL;

ALTER TABLE `matches`
    ADD COLUMN `league_season_id` VARCHAR(191) NULL;

CREATE INDEX `conferences_league_season_id_idx` ON `conferences`(`league_season_id`);
CREATE INDEX `season_teams_league_season_id_idx` ON `season_teams`(`league_season_id`);
CREATE INDEX `matches_league_season_id_idx` ON `matches`(`league_season_id`);

ALTER TABLE `conferences`
    ADD CONSTRAINT `conferences_league_season_id_fkey`
    FOREIGN KEY (`league_season_id`) REFERENCES `league_seasons`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `season_teams`
    ADD CONSTRAINT `season_teams_league_season_id_fkey`
    FOREIGN KEY (`league_season_id`) REFERENCES `league_seasons`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `matches`
    ADD CONSTRAINT `matches_league_season_id_fkey`
    FOREIGN KEY (`league_season_id`) REFERENCES `league_seasons`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
