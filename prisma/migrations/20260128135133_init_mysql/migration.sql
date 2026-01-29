-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'EDITOR') NOT NULL DEFAULT 'EDITOR',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `news_articles` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `excerpt` VARCHAR(191) NULL,
    `category` ENUM('INTERVIEWS', 'CHAMPIONSHIPS', 'MATCH_REPORT', 'ANALYSIS') NOT NULL,
    `image` VARCHAR(191) NULL,
    `published` BOOLEAN NOT NULL DEFAULT false,
    `published_at` DATETIME(3) NULL,
    `author_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `feature` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `news_articles_slug_key`(`slug`),
    INDEX `news_articles_category_idx`(`category`),
    INDEX `news_articles_published_at_idx`(`published_at`),
    INDEX `news_articles_published_idx`(`published`),
    INDEX `news_articles_feature_idx`(`feature`),
    INDEX `news_articles_author_id_idx`(`author_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leagues` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `logo` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `leagues_name_key`(`name`),
    UNIQUE INDEX `leagues_slug_key`(`slug`),
    INDEX `leagues_name_idx`(`name`),
    INDEX `leagues_slug_idx`(`slug`),
    INDEX `leagues_active_idx`(`active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seasons` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `start_date` DATETIME(3) NOT NULL,
    `end_date` DATETIME(3) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `bracket_type` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `league_id` VARCHAR(191) NOT NULL,

    INDEX `seasons_name_idx`(`name`),
    INDEX `seasons_slug_idx`(`slug`),
    INDEX `seasons_active_idx`(`active`),
    INDEX `seasons_start_date_idx`(`start_date`),
    INDEX `seasons_end_date_idx`(`end_date`),
    INDEX `seasons_league_id_idx`(`league_id`),
    INDEX `seasons_bracket_type_idx`(`bracket_type`),
    UNIQUE INDEX `seasons_league_id_slug_key`(`league_id`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `matches` (
    `id` VARCHAR(191) NOT NULL,
    `team1_name` VARCHAR(191) NULL,
    `team1_logo` VARCHAR(191) NULL,
    `team2_name` VARCHAR(191) NULL,
    `team2_logo` VARCHAR(191) NULL,
    `date` DATETIME(3) NOT NULL,
    `team1_score` INTEGER NULL,
    `team2_score` INTEGER NULL,
    `status` ENUM('UPCOMING', 'LIVE', 'COMPLETED') NOT NULL DEFAULT 'UPCOMING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `league_id` VARCHAR(191) NULL,
    `league_name` VARCHAR(191) NULL,
    `season_id` VARCHAR(191) NULL,
    `team1_id` VARCHAR(191) NULL,
    `team2_id` VARCHAR(191) NULL,
    `stage` ENUM('REGULAR_SEASON', 'PRESEASON', 'EXHIBITION', 'PLAYOFF', 'QUARTER_FINALS', 'SEMI_FINALS', 'CHAMPIONSHIP', 'QUALIFIER', 'OTHER') NULL,
    `game_rules_id` VARCHAR(191) NULL,
    `current_period` INTEGER NOT NULL DEFAULT 1,
    `clock_seconds` INTEGER NULL,
    `clock_running` BOOLEAN NOT NULL DEFAULT false,
    `possession_team_id` VARCHAR(191) NULL,
    `team1_timeouts` INTEGER NOT NULL DEFAULT 0,
    `team2_timeouts` INTEGER NOT NULL DEFAULT 0,
    `team1_fouls` INTEGER NOT NULL DEFAULT 0,
    `team2_fouls` INTEGER NOT NULL DEFAULT 0,
    `duration` INTEGER NULL,
    `tracking_mode` ENUM('TEAM', 'INDIVIDUAL', 'BOTH') NOT NULL DEFAULT 'BOTH',
    `winner_id` VARCHAR(191) NULL,
    `next_winner_match_id` VARCHAR(191) NULL,
    `next_loser_match_id` VARCHAR(191) NULL,
    `bracket_position` INTEGER NULL,
    `bracket_round` INTEGER NULL,
    `bracket_type` VARCHAR(191) NULL,

    INDEX `matches_date_idx`(`date`),
    INDEX `matches_status_idx`(`status`),
    INDEX `matches_stage_idx`(`stage`),
    INDEX `matches_team1_id_idx`(`team1_id`),
    INDEX `matches_team2_id_idx`(`team2_id`),
    INDEX `matches_league_id_idx`(`league_id`),
    INDEX `matches_season_id_idx`(`season_id`),
    INDEX `matches_game_rules_id_idx`(`game_rules_id`),
    INDEX `matches_possession_team_id_idx`(`possession_team_id`),
    INDEX `matches_winner_id_idx`(`winner_id`),
    INDEX `matches_next_winner_match_id_idx`(`next_winner_match_id`),
    INDEX `matches_next_loser_match_id_idx`(`next_loser_match_id`),
    INDEX `matches_bracket_position_idx`(`bracket_position`),
    INDEX `matches_bracket_round_idx`(`bracket_round`),
    INDEX `matches_bracket_type_idx`(`bracket_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teams` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `logo` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `approved` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `teams_name_key`(`name`),
    UNIQUE INDEX `teams_slug_key`(`slug`),
    INDEX `teams_name_idx`(`name`),
    INDEX `teams_slug_idx`(`slug`),
    INDEX `teams_approved_idx`(`approved`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `players` (
    `id` VARCHAR(191) NOT NULL,
    `image` VARCHAR(191) NULL,
    `bio` VARCHAR(191) NULL,
    `position` VARCHAR(191) NULL,
    `jersey_number` INTEGER NULL,
    `stats` JSON NULL,
    `approved` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `team_id` VARCHAR(191) NULL,
    `first_name` VARCHAR(191) NULL,
    `height` VARCHAR(191) NULL,
    `last_name` VARCHAR(191) NULL,
    `weight` VARCHAR(191) NULL,

    INDEX `players_team_id_idx`(`team_id`),
    INDEX `players_approved_idx`(`approved`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `media` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `type` ENUM('IMAGE', 'VIDEO', 'AUDIO') NOT NULL,
    `thumbnail` VARCHAR(191) NULL,
    `tags` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `media_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `page_contents` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `meta_title` VARCHAR(191) NULL,
    `meta_description` VARCHAR(191) NULL,
    `published` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `page_contents_slug_key`(`slug`),
    INDEX `page_contents_slug_idx`(`slug`),
    INDEX `page_contents_published_idx`(`published`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `site_settings` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'text',
    `label` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `category` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `site_settings_key_key`(`key`),
    INDEX `site_settings_key_idx`(`key`),
    INDEX `site_settings_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `staff` (
    `id` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `role` ENUM('COACH', 'ASSISTANT_COACH', 'MANAGER', 'ASSISTANT_MANAGER', 'PHYSIOTHERAPIST', 'TRAINER', 'ANALYST', 'OTHER') NOT NULL,
    `bio` VARCHAR(191) NULL,
    `image` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `staff_role_idx`(`role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `team_staff` (
    `id` VARCHAR(191) NOT NULL,
    `team_id` VARCHAR(191) NOT NULL,
    `staff_id` VARCHAR(191) NOT NULL,
    `role` ENUM('COACH', 'ASSISTANT_COACH', 'MANAGER', 'ASSISTANT_MANAGER', 'PHYSIOTHERAPIST', 'TRAINER', 'ANALYST', 'OTHER') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `team_staff_team_id_idx`(`team_id`),
    INDEX `team_staff_staff_id_idx`(`staff_id`),
    UNIQUE INDEX `team_staff_team_id_staff_id_key`(`team_id`, `staff_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `comments` (
    `id` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `author_name` VARCHAR(191) NULL,
    `author_email` VARCHAR(191) NULL,
    `author_url` VARCHAR(191) NULL,
    `approved` BOOLEAN NOT NULL DEFAULT false,
    `article_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NULL,
    `parent_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `comments_article_id_idx`(`article_id`),
    INDEX `comments_user_id_idx`(`user_id`),
    INDEX `comments_parent_id_idx`(`parent_id`),
    INDEX `comments_approved_idx`(`approved`),
    INDEX `comments_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `match_players` (
    `id` VARCHAR(191) NOT NULL,
    `match_id` VARCHAR(191) NOT NULL,
    `player_id` VARCHAR(191) NOT NULL,
    `team_id` VARCHAR(191) NOT NULL,
    `started` BOOLEAN NOT NULL DEFAULT false,
    `position` VARCHAR(191) NULL,
    `jersey_number` INTEGER NULL,
    `home_jersey_number` INTEGER NULL,
    `away_jersey_number` INTEGER NULL,
    `minutes_played` INTEGER NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `match_players_match_id_idx`(`match_id`),
    INDEX `match_players_player_id_idx`(`player_id`),
    INDEX `match_players_team_id_idx`(`team_id`),
    INDEX `match_players_is_active_idx`(`is_active`),
    UNIQUE INDEX `match_players_match_id_player_id_team_id_key`(`match_id`, `player_id`, `team_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `match_events` (
    `id` VARCHAR(191) NOT NULL,
    `match_id` VARCHAR(191) NOT NULL,
    `event_type` ENUM('TWO_POINT_MADE', 'TWO_POINT_MISSED', 'THREE_POINT_MADE', 'THREE_POINT_MISSED', 'FREE_THROW_MADE', 'FREE_THROW_MISSED', 'ASSIST', 'REBOUND_OFFENSIVE', 'REBOUND_DEFENSIVE', 'STEAL', 'BLOCK', 'TURNOVER', 'FOUL_PERSONAL', 'FOUL_TECHNICAL', 'FOUL_FLAGRANT', 'SUBSTITUTION_IN', 'SUBSTITUTION_OUT', 'TIMEOUT', 'INJURY', 'BREAK', 'PLAY_RESUMED', 'JUMP_BALL', 'OTHER') NOT NULL,
    `minute` INTEGER NOT NULL,
    `period` INTEGER NOT NULL DEFAULT 1,
    `seconds_remaining` INTEGER NULL,
    `sequence_number` INTEGER NOT NULL DEFAULT 0,
    `player_id` VARCHAR(191) NULL,
    `team_id` VARCHAR(191) NULL,
    `assist_player_id` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `is_undone` BOOLEAN NOT NULL DEFAULT false,
    `undone_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `match_events_match_id_idx`(`match_id`),
    INDEX `match_events_player_id_idx`(`player_id`),
    INDEX `match_events_team_id_idx`(`team_id`),
    INDEX `match_events_event_type_idx`(`event_type`),
    INDEX `match_events_minute_idx`(`minute`),
    INDEX `match_events_period_idx`(`period`),
    INDEX `match_events_sequence_number_idx`(`sequence_number`),
    INDEX `match_events_is_undone_idx`(`is_undone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `registration_notifications` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('TEAM_REGISTERED', 'PLAYER_REGISTERED', 'PLAYER_AUTO_LINKED') NOT NULL,
    `team_id` VARCHAR(191) NULL,
    `player_id` VARCHAR(191) NULL,
    `staff_id` VARCHAR(191) NULL,
    `message` VARCHAR(191) NOT NULL,
    `read` BOOLEAN NOT NULL DEFAULT false,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `registration_notifications_type_idx`(`type`),
    INDEX `registration_notifications_read_idx`(`read`),
    INDEX `registration_notifications_created_at_idx`(`created_at`),
    INDEX `registration_notifications_team_id_idx`(`team_id`),
    INDEX `registration_notifications_player_id_idx`(`player_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `game_rules` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `number_of_periods` INTEGER NOT NULL DEFAULT 4,
    `minutes_per_period` INTEGER NOT NULL DEFAULT 10,
    `overtime_length` INTEGER NOT NULL DEFAULT 5,
    `halftime_period` INTEGER NOT NULL DEFAULT 2,
    `halftime_duration_minutes` INTEGER NOT NULL DEFAULT 15,
    `timeouts_60_second` INTEGER NOT NULL DEFAULT 6,
    `timeouts_30_second` INTEGER NOT NULL DEFAULT 2,
    `timeouts_per_overtime` INTEGER NOT NULL DEFAULT 2,
    `reset_timeouts_per_period` BOOLEAN NOT NULL DEFAULT false,
    `fouls_for_bonus` INTEGER NOT NULL DEFAULT 5,
    `fouls_for_double_bonus` INTEGER NOT NULL DEFAULT 10,
    `enable_three_point_shots` BOOLEAN NOT NULL DEFAULT true,
    `fouls_to_foul_out` INTEGER NOT NULL DEFAULT 5,
    `display_game_clock` BOOLEAN NOT NULL DEFAULT true,
    `track_turnover_types` BOOLEAN NOT NULL DEFAULT false,
    `track_foul_types` BOOLEAN NOT NULL DEFAULT false,
    `track_playing_time` BOOLEAN NOT NULL DEFAULT false,
    `record_shot_locations` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `game_rules_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `game_states` (
    `id` VARCHAR(191) NOT NULL,
    `match_id` VARCHAR(191) NOT NULL,
    `period` INTEGER NOT NULL,
    `clock_seconds` INTEGER NOT NULL,
    `clock_running` BOOLEAN NOT NULL DEFAULT false,
    `team1_score` INTEGER NOT NULL DEFAULT 0,
    `team2_score` INTEGER NOT NULL DEFAULT 0,
    `team1_fouls` INTEGER NOT NULL DEFAULT 0,
    `team2_fouls` INTEGER NOT NULL DEFAULT 0,
    `team1_timeouts` INTEGER NOT NULL DEFAULT 0,
    `team2_timeouts` INTEGER NOT NULL DEFAULT 0,
    `possession_team_id` VARCHAR(191) NULL,
    `snapshot` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `game_states_match_id_idx`(`match_id`),
    INDEX `game_states_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `match_periods` (
    `id` VARCHAR(191) NOT NULL,
    `match_id` VARCHAR(191) NOT NULL,
    `period_number` INTEGER NOT NULL,
    `start_time` DATETIME(3) NOT NULL,
    `end_time` DATETIME(3) NULL,
    `team1_score` INTEGER NOT NULL DEFAULT 0,
    `team2_score` INTEGER NOT NULL DEFAULT 0,
    `team1_fouls` INTEGER NOT NULL DEFAULT 0,
    `team2_fouls` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `match_periods_match_id_idx`(`match_id`),
    INDEX `match_periods_period_number_idx`(`period_number`),
    UNIQUE INDEX `match_periods_match_id_period_number_key`(`match_id`, `period_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `timeouts` (
    `id` VARCHAR(191) NOT NULL,
    `match_id` VARCHAR(191) NOT NULL,
    `team_id` VARCHAR(191) NOT NULL,
    `period` INTEGER NOT NULL,
    `timeout_type` ENUM('SIXTY_SECOND', 'THIRTY_SECOND') NOT NULL,
    `seconds_remaining` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `timeouts_match_id_idx`(`match_id`),
    INDEX `timeouts_team_id_idx`(`team_id`),
    INDEX `timeouts_period_idx`(`period`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `substitutions` (
    `id` VARCHAR(191) NOT NULL,
    `match_id` VARCHAR(191) NOT NULL,
    `team_id` VARCHAR(191) NOT NULL,
    `player_in_id` VARCHAR(191) NOT NULL,
    `player_out_id` VARCHAR(191) NOT NULL,
    `period` INTEGER NOT NULL,
    `seconds_remaining` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `substitutions_match_id_idx`(`match_id`),
    INDEX `substitutions_team_id_idx`(`team_id`),
    INDEX `substitutions_player_in_id_idx`(`player_in_id`),
    INDEX `substitutions_player_out_id_idx`(`player_out_id`),
    INDEX `substitutions_period_idx`(`period`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `player_playing_time` (
    `id` VARCHAR(191) NOT NULL,
    `match_player_id` VARCHAR(191) NOT NULL,
    `period` INTEGER NOT NULL,
    `entry_time` DATETIME(3) NOT NULL,
    `exit_time` DATETIME(3) NULL,
    `seconds_played` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `player_playing_time_match_player_id_idx`(`match_player_id`),
    INDEX `player_playing_time_period_idx`(`period`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `jump_balls` (
    `id` VARCHAR(191) NOT NULL,
    `match_id` VARCHAR(191) NOT NULL,
    `period` INTEGER NOT NULL,
    `player1_id` VARCHAR(191) NOT NULL,
    `player2_id` VARCHAR(191) NOT NULL,
    `possession_team_id` VARCHAR(191) NULL,
    `seconds_remaining` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `jump_balls_match_id_idx`(`match_id`),
    INDEX `jump_balls_period_idx`(`period`),
    INDEX `jump_balls_player1_id_idx`(`player1_id`),
    INDEX `jump_balls_player2_id_idx`(`player2_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_history` (
    `id` VARCHAR(191) NOT NULL,
    `match_event_id` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `previous_value` JSON NULL,
    `new_value` JSON NULL,
    `changed_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `event_history_match_event_id_idx`(`match_event_id`),
    INDEX `event_history_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_templates` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `report_type` ENUM('GAME_STATISTICS', 'KEY_GAME_STATISTICS', 'PLAYER_STATISTICS', 'TEAM_STATISTICS', 'PLAY_BY_PLAY', 'SHOT_CHART', 'TURNOVER_TYPES', 'FOUL_TYPES') NOT NULL,
    `format` ENUM('PDF', 'CSV') NOT NULL DEFAULT 'PDF',
    `template` JSON NOT NULL,
    `is_default` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `report_templates_report_type_idx`(`report_type`),
    INDEX `report_templates_format_idx`(`format`),
    INDEX `report_templates_is_default_idx`(`is_default`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_generations` (
    `id` VARCHAR(191) NOT NULL,
    `template_id` VARCHAR(191) NULL,
    `report_type` ENUM('GAME_STATISTICS', 'KEY_GAME_STATISTICS', 'PLAYER_STATISTICS', 'TEAM_STATISTICS', 'PLAY_BY_PLAY', 'SHOT_CHART', 'TURNOVER_TYPES', 'FOUL_TYPES') NOT NULL,
    `format` ENUM('PDF', 'CSV') NOT NULL,
    `file_name` VARCHAR(191) NOT NULL,
    `file_path` VARCHAR(191) NULL,
    `file_url` VARCHAR(191) NULL,
    `parameters` JSON NULL,
    `generated_by` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `error_message` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `report_generations_template_id_idx`(`template_id`),
    INDEX `report_generations_report_type_idx`(`report_type`),
    INDEX `report_generations_status_idx`(`status`),
    INDEX `report_generations_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_reports` (
    `id` VARCHAR(191) NOT NULL,
    `report_generation_id` VARCHAR(191) NOT NULL,
    `recipient_email` VARCHAR(191) NOT NULL,
    `recipient_name` VARCHAR(191) NULL,
    `subject` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `sent_at` DATETIME(3) NULL,
    `error_message` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `email_reports_report_generation_id_idx`(`report_generation_id`),
    INDEX `email_reports_status_idx`(`status`),
    INDEX `email_reports_recipient_email_idx`(`recipient_email`),
    INDEX `email_reports_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `news_articles` ADD CONSTRAINT `news_articles_author_id_fkey` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seasons` ADD CONSTRAINT `seasons_league_id_fkey` FOREIGN KEY (`league_id`) REFERENCES `leagues`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matches` ADD CONSTRAINT `matches_league_id_fkey` FOREIGN KEY (`league_id`) REFERENCES `leagues`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matches` ADD CONSTRAINT `matches_season_id_fkey` FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matches` ADD CONSTRAINT `matches_team1_id_fkey` FOREIGN KEY (`team1_id`) REFERENCES `teams`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matches` ADD CONSTRAINT `matches_team2_id_fkey` FOREIGN KEY (`team2_id`) REFERENCES `teams`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matches` ADD CONSTRAINT `matches_game_rules_id_fkey` FOREIGN KEY (`game_rules_id`) REFERENCES `game_rules`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matches` ADD CONSTRAINT `matches_possession_team_id_fkey` FOREIGN KEY (`possession_team_id`) REFERENCES `teams`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matches` ADD CONSTRAINT `matches_winner_id_fkey` FOREIGN KEY (`winner_id`) REFERENCES `teams`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matches` ADD CONSTRAINT `matches_next_winner_match_id_fkey` FOREIGN KEY (`next_winner_match_id`) REFERENCES `matches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matches` ADD CONSTRAINT `matches_next_loser_match_id_fkey` FOREIGN KEY (`next_loser_match_id`) REFERENCES `matches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `players` ADD CONSTRAINT `players_team_id_fkey` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `team_staff` ADD CONSTRAINT `team_staff_staff_id_fkey` FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `team_staff` ADD CONSTRAINT `team_staff_team_id_fkey` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comments` ADD CONSTRAINT `comments_article_id_fkey` FOREIGN KEY (`article_id`) REFERENCES `news_articles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comments` ADD CONSTRAINT `comments_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `comments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comments` ADD CONSTRAINT `comments_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_players` ADD CONSTRAINT `match_players_match_id_fkey` FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_players` ADD CONSTRAINT `match_players_player_id_fkey` FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_players` ADD CONSTRAINT `match_players_team_id_fkey` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_events` ADD CONSTRAINT `match_events_assist_player_id_fkey` FOREIGN KEY (`assist_player_id`) REFERENCES `players`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_events` ADD CONSTRAINT `match_events_match_id_fkey` FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_events` ADD CONSTRAINT `match_events_player_id_fkey` FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_events` ADD CONSTRAINT `match_events_team_id_fkey` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registration_notifications` ADD CONSTRAINT `registration_notifications_team_id_fkey` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registration_notifications` ADD CONSTRAINT `registration_notifications_player_id_fkey` FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registration_notifications` ADD CONSTRAINT `registration_notifications_staff_id_fkey` FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `game_states` ADD CONSTRAINT `game_states_match_id_fkey` FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_periods` ADD CONSTRAINT `match_periods_match_id_fkey` FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timeouts` ADD CONSTRAINT `timeouts_match_id_fkey` FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timeouts` ADD CONSTRAINT `timeouts_team_id_fkey` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `substitutions` ADD CONSTRAINT `substitutions_match_id_fkey` FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `substitutions` ADD CONSTRAINT `substitutions_team_id_fkey` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `substitutions` ADD CONSTRAINT `substitutions_player_in_id_fkey` FOREIGN KEY (`player_in_id`) REFERENCES `players`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `substitutions` ADD CONSTRAINT `substitutions_player_out_id_fkey` FOREIGN KEY (`player_out_id`) REFERENCES `players`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `player_playing_time` ADD CONSTRAINT `player_playing_time_match_player_id_fkey` FOREIGN KEY (`match_player_id`) REFERENCES `match_players`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jump_balls` ADD CONSTRAINT `jump_balls_match_id_fkey` FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jump_balls` ADD CONSTRAINT `jump_balls_player1_id_fkey` FOREIGN KEY (`player1_id`) REFERENCES `players`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jump_balls` ADD CONSTRAINT `jump_balls_player2_id_fkey` FOREIGN KEY (`player2_id`) REFERENCES `players`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jump_balls` ADD CONSTRAINT `jump_balls_possession_team_id_fkey` FOREIGN KEY (`possession_team_id`) REFERENCES `teams`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_generations` ADD CONSTRAINT `report_generations_template_id_fkey` FOREIGN KEY (`template_id`) REFERENCES `report_templates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `email_reports` ADD CONSTRAINT `email_reports_report_generation_id_fkey` FOREIGN KEY (`report_generation_id`) REFERENCES `report_generations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
