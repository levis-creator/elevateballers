-- Existing completed matches are already public, so backfill them while adding
-- an explicit publication state for future finals.
ALTER TABLE `matches`
  ADD COLUMN `result_published_at` DATETIME(3) NULL;

UPDATE `matches`
SET `result_published_at` = `updated_at`
WHERE `status` = 'COMPLETED';

CREATE INDEX `matches_result_published_at_idx`
  ON `matches`(`result_published_at`);
