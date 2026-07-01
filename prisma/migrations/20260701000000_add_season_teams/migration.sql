-- Tracks which teams participate in each season (per-season roster). A team can
-- belong to many seasons, and a league's teams are the union across its seasons.
-- Additive only: a single new join table, no changes to existing tables.
-- A backfill script (scripts/backfill-season-teams.js) seeds existing seasons
-- from the teams already appearing in their matches.

-- CreateTable
CREATE TABLE `season_teams` (
    `id` VARCHAR(191) NOT NULL,
    `season_id` VARCHAR(191) NOT NULL,
    `team_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `season_teams_season_id_idx`(`season_id`),
    INDEX `season_teams_team_id_idx`(`team_id`),
    UNIQUE INDEX `season_teams_season_id_team_id_key`(`season_id`, `team_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `season_teams` ADD CONSTRAINT `season_teams_season_id_fkey` FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `season_teams` ADD CONSTRAINT `season_teams_team_id_fkey` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
