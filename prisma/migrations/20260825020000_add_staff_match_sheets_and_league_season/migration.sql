ALTER TABLE `team_staff`
  ADD COLUMN `league_season_id` VARCHAR(191) NULL,
  ADD INDEX `team_staff_league_season_id_idx` (`league_season_id`),
  ADD CONSTRAINT `team_staff_league_season_id_fkey`
    FOREIGN KEY (`league_season_id`) REFERENCES `league_seasons`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE `staff_match_sheets` (
  `id` VARCHAR(191) NOT NULL,
  `staff_id` VARCHAR(191) NOT NULL,
  `match_id` VARCHAR(191) NOT NULL,
  `team_id` VARCHAR(191) NOT NULL,
  `capacity` VARCHAR(80) NOT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'APPEARED',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  UNIQUE INDEX `staff_match_sheets_staff_id_match_id_team_id_capacity_key` (`staff_id`, `match_id`, `team_id`, `capacity`),
  INDEX `staff_match_sheets_staff_id_created_at_idx` (`staff_id`, `created_at`),
  INDEX `staff_match_sheets_match_id_idx` (`match_id`),
  INDEX `staff_match_sheets_team_id_idx` (`team_id`),
  PRIMARY KEY (`id`),
  CONSTRAINT `staff_match_sheets_staff_id_fkey` FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `staff_match_sheets_match_id_fkey` FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `staff_match_sheets_team_id_fkey` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
