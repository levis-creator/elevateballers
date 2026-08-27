ALTER TABLE `season_team_players`
  ADD COLUMN `removal_requested_at` DATETIME(3) NULL,
  ADD COLUMN `removal_requested_by_id` VARCHAR(191) NULL;
