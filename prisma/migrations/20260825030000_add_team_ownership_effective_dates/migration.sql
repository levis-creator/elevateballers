ALTER TABLE `team_ownerships`
  ADD COLUMN `effective_from` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ADD COLUMN `effective_to` DATETIME(3) NULL,
  ADD INDEX `team_ownership_scope_idx` (`team_id`, `revoked_at`, `effective_from`, `effective_to`);
