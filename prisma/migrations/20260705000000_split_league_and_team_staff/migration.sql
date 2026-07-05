-- Safe additive migration for splitting org-wide league staff from team-scoped coaching staff.
-- No legacy staff/team_staff tables or columns are dropped or renamed here.

CREATE TABLE IF NOT EXISTS `league_staff` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `role` VARCHAR(191) NOT NULL,
  `department` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NULL,
  `photo` VARCHAR(191) NULL,
  `active` BOOLEAN NOT NULL DEFAULT true,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `league_staff_department_idx` ON `league_staff`(`department`);
CREATE INDEX `league_staff_active_idx` ON `league_staff`(`active`);
CREATE INDEX `league_staff_sort_order_idx` ON `league_staff`(`sort_order`);

CREATE TABLE IF NOT EXISTS `team_staff_members` (
  `id` VARCHAR(191) NOT NULL,
  `team_id` VARCHAR(191) NOT NULL,
  `season_id` VARCHAR(191) NULL,
  `name` VARCHAR(191) NOT NULL,
  `role` VARCHAR(191) NOT NULL,
  `type` VARCHAR(32) NOT NULL,
  `email` VARCHAR(191) NULL,
  `photo` VARCHAR(191) NULL,
  `legacy_staff_id` VARCHAR(191) NULL,
  `legacy_team_staff_id` VARCHAR(191) NULL,
  `active` BOOLEAN NOT NULL DEFAULT true,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `team_staff_members_legacy_team_staff_id_key`(`legacy_team_staff_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `team_staff_members_team_id_idx` ON `team_staff_members`(`team_id`);
CREATE INDEX `team_staff_members_season_id_idx` ON `team_staff_members`(`season_id`);
CREATE INDEX `team_staff_members_legacy_staff_id_idx` ON `team_staff_members`(`legacy_staff_id`);
CREATE INDEX `team_staff_members_type_idx` ON `team_staff_members`(`type`);
CREATE INDEX `team_staff_members_active_idx` ON `team_staff_members`(`active`);

ALTER TABLE `team_staff_members`
  ADD CONSTRAINT `team_staff_members_team_id_fkey`
  FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `team_staff_members`
  ADD CONSTRAINT `team_staff_members_season_id_fkey`
  FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
