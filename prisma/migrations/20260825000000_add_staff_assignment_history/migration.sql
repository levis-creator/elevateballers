ALTER TABLE `team_staff`
  ADD COLUMN `effective_to` DATETIME(3) NULL;

CREATE TABLE `staff_transfers` (
  `id` VARCHAR(191) NOT NULL,
  `staff_id` VARCHAR(191) NOT NULL,
  `from_team_id` VARCHAR(191) NOT NULL,
  `to_team_id` VARCHAR(191) NOT NULL,
  `effective_from` DATETIME(3) NOT NULL,
  `reason` VARCHAR(500) NULL,
  `actor_user_id` VARCHAR(191) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `staff_transfers_staff_id_effective_from_idx` (`staff_id`, `effective_from`),
  INDEX `staff_transfers_from_team_id_idx` (`from_team_id`),
  INDEX `staff_transfers_to_team_id_idx` (`to_team_id`),
  INDEX `staff_transfers_actor_user_id_idx` (`actor_user_id`),
  CONSTRAINT `staff_transfers_staff_id_fkey` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `staff_transfers_from_team_id_fkey` FOREIGN KEY (`from_team_id`) REFERENCES `teams` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `staff_transfers_to_team_id_fkey` FOREIGN KEY (`to_team_id`) REFERENCES `teams` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `staff_transfers_actor_user_id_fkey` FOREIGN KEY (`actor_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
