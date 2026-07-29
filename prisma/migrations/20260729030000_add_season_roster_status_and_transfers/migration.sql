ALTER TABLE `season_team_players`
  ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING';

CREATE INDEX `season_team_players_league_season_id_status_idx`
  ON `season_team_players` (`league_season_id`, `status`);

CREATE UNIQUE INDEX `season_team_players_league_season_id_team_id_player_id_key`
  ON `season_team_players` (`league_season_id`, `team_id`, `player_id`);

CREATE TABLE `season_player_transfers` (
    `id` VARCHAR(191) NOT NULL,
    `league_season_id` VARCHAR(191) NOT NULL,
    `player_id` VARCHAR(191) NOT NULL,
    `from_season_team_id` VARCHAR(191) NOT NULL,
    `to_season_team_id` VARCHAR(191) NOT NULL,
    `from_roster_id` VARCHAR(191) NULL,
    `to_roster_id` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `requested_by_id` VARCHAR(191) NULL,
    `reviewed_by_id` VARCHAR(191) NULL,
    `reason` TEXT NULL,
    `reviewed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `season_player_transfers_league_season_id_status_idx` (`league_season_id`, `status`),
    INDEX `season_player_transfers_player_id_league_season_id_idx` (`player_id`, `league_season_id`),
    INDEX `season_player_transfers_from_season_team_id_idx` (`from_season_team_id`),
    INDEX `season_player_transfers_to_season_team_id_idx` (`to_season_team_id`),
    CONSTRAINT `season_player_transfers_league_season_id_fkey` FOREIGN KEY (`league_season_id`) REFERENCES `league_seasons` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `season_player_transfers_player_id_fkey` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `season_player_transfers_from_season_team_id_fkey` FOREIGN KEY (`from_season_team_id`) REFERENCES `season_teams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `season_player_transfers_to_season_team_id_fkey` FOREIGN KEY (`to_season_team_id`) REFERENCES `season_teams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `season_player_transfers_from_roster_id_fkey` FOREIGN KEY (`from_roster_id`) REFERENCES `season_team_players` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `season_player_transfers_to_roster_id_fkey` FOREIGN KEY (`to_roster_id`) REFERENCES `season_team_players` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `season_roster_history` (
    `id` VARCHAR(191) NOT NULL,
    `league_season_id` VARCHAR(191) NOT NULL,
    `player_id` VARCHAR(191) NOT NULL,
    `season_team_id` VARCHAR(191) NOT NULL,
    `roster_id` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `from_team_id` VARCHAR(191) NULL,
    `to_team_id` VARCHAR(191) NULL,
    `reason` TEXT NULL,
    `changed_by_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    INDEX `season_roster_history_league_season_id_player_id_created_at_idx` (`league_season_id`, `player_id`, `created_at`),
    INDEX `season_roster_history_season_team_id_created_at_idx` (`season_team_id`, `created_at`),
    CONSTRAINT `season_roster_history_league_season_id_fkey` FOREIGN KEY (`league_season_id`) REFERENCES `league_seasons` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `season_roster_history_player_id_fkey` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `season_roster_history_season_team_id_fkey` FOREIGN KEY (`season_team_id`) REFERENCES `season_teams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `season_roster_history_roster_id_fkey` FOREIGN KEY (`roster_id`) REFERENCES `season_team_players` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
