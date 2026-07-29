CREATE INDEX `season_team_players_season_team_id_status_left_at_idx`
  ON `season_team_players` (`season_team_id`, `status`, `left_at`);

CREATE INDEX `season_team_players_player_id_status_left_at_idx`
  ON `season_team_players` (`player_id`, `status`, `left_at`);

CREATE INDEX `season_player_transfers_status_created_at_idx`
  ON `season_player_transfers` (`status`, `created_at`);

CREATE INDEX `season_roster_history_player_id_created_at_idx`
  ON `season_roster_history` (`player_id`, `created_at`);
