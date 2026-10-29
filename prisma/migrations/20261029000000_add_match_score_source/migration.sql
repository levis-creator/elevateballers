-- Where a match's stored score came from. Existing rows start as NONE and are
-- classified by scripts/backfill-match-score-source.ts.
ALTER TABLE `matches`
ADD COLUMN `score_source` ENUM('NONE', 'MANUAL', 'PLAY_BY_PLAY') NOT NULL DEFAULT 'NONE';

CREATE INDEX `matches_score_source_idx` ON `matches`(`score_source`);
