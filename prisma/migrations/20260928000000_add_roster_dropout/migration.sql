ALTER TABLE `season_team_players`
  ADD COLUMN `dropout_requested_at` DATETIME(3) NULL,
  ADD COLUMN `dropped_out_at` DATETIME(3) NULL,
  ADD COLUMN `dropout_reason` TEXT NULL;
