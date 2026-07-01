-- One-off recovery for the wedged 20260703000000_seasons_leagues_many_to_many
-- migration on the LOCAL database. Steps 1-14 of that migration already applied;
-- only these final two statements remain (slug dedupe + global-unique index).
-- Safe to run once. After running, mark the migration resolved (see instructions).

-- Rename any seasons that share a slug so the unique index can be created.
-- Keeps the earliest row's slug; suffixes the rest with their id. No-op if unique.
UPDATE `seasons` `s`
JOIN (
    SELECT `slug`, MIN(`id`) AS `keep_id`
    FROM `seasons`
    GROUP BY `slug`
    HAVING COUNT(*) > 1
) `dup` ON `s`.`slug` = `dup`.`slug` AND `s`.`id` <> `dup`.`keep_id`
SET `s`.`slug` = CONCAT(`s`.`slug`, '-', `s`.`id`);

-- Season slug is now globally unique.
CREATE UNIQUE INDEX `seasons_slug_key` ON `seasons`(`slug`);
