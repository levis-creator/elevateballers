ALTER TABLE `two_factor_otps`
  ADD COLUMN `attempt_count` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `locked_until` DATETIME(3) NULL;
