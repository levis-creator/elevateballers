-- Idempotency keys for the live match console.
--
-- The console stamps every event, timeout and substitution batch with a key
-- minted at the tap and retries until the server confirms. These unique
-- indexes make the database reject a second copy outright, so a retry that
-- races the original request can never record the same thing twice.
-- All new columns are nullable: rows written before this have no key.

-- 1. Substitutions: one row per pair, keyed by batch + player going off.
--    Production has one batch saved twice (a retry race on 2026-05-03); keep
--    the earliest row of each duplicate so the unique index can be built.
DELETE s
FROM `substitutions` s
JOIN `substitutions` k
  ON k.`match_id` = s.`match_id`
 AND k.`client_batch_id` = s.`client_batch_id`
 AND k.`player_out_id` = s.`player_out_id`
 AND (k.`created_at` < s.`created_at` OR (k.`created_at` = s.`created_at` AND k.`id` < s.`id`))
WHERE s.`client_batch_id` IS NOT NULL;

-- Build the unique index before dropping the old one, so the match_id
-- foreign key always has an index to use.
CREATE UNIQUE INDEX `substitutions_match_id_client_batch_id_player_out_id_key`
  ON `substitutions`(`match_id`, `client_batch_id`, `player_out_id`);
DROP INDEX `substitutions_match_id_client_batch_id_idx` ON `substitutions`;

-- 2. Match events.
ALTER TABLE `match_events` ADD COLUMN `client_id` VARCHAR(64) NULL;
CREATE UNIQUE INDEX `match_events_match_id_client_id_key` ON `match_events`(`match_id`, `client_id`);

-- 3. Timeouts.
ALTER TABLE `timeouts` ADD COLUMN `client_id` VARCHAR(64) NULL;
CREATE UNIQUE INDEX `timeouts_match_id_client_id_key` ON `timeouts`(`match_id`, `client_id`);
