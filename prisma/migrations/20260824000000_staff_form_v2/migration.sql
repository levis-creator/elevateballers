ALTER TABLE `staff`
  ADD COLUMN `tagline` VARCHAR(90) NULL,
  ADD COLUMN `phone_secondary` VARCHAR(191) NULL,
  ADD COLUMN `next_of_kin` VARCHAR(191) NULL,
  ADD COLUMN `internal_note` TEXT NULL,
  ADD COLUMN `license_number` VARCHAR(191) NULL,
  ADD COLUMN `license_expires_at` DATETIME(3) NULL,
  ADD COLUMN `safeguarding_status` VARCHAR(191) NULL,
  ADD COLUMN `id_number` VARCHAR(191) NULL,
  ADD COLUMN `active` BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE `team_staff`
  ADD COLUMN `effective_from` DATETIME(3) NULL;
