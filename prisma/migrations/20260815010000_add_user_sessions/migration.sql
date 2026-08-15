CREATE TABLE `user_sessions` (
  `id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL,
  `token_hash` VARCHAR(191) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `last_seen_at` DATETIME(3) NULL,
  `expires_at` DATETIME(3) NOT NULL,
  `revoked_at` DATETIME(3) NULL,
  `revoke_reason` VARCHAR(191) NULL,

  UNIQUE INDEX `user_sessions_token_hash_key` (`token_hash`),
  INDEX `user_sessions_user_id_revoked_at_expires_at_idx` (`user_id`, `revoked_at`, `expires_at`),
  INDEX `user_sessions_user_id_created_at_idx` (`user_id`, `created_at`),
  INDEX `user_sessions_expires_at_idx` (`expires_at`),
  PRIMARY KEY (`id`),
  CONSTRAINT `user_sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
