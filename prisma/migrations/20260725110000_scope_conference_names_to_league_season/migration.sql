-- Phase 5: conference names are unique inside one competition edition, not
-- across the shared umbrella season. Phase 3 guarantees existing conferences
-- already carry league_season_id before this constraint is introduced.
DROP INDEX `conferences_season_id_name_key` ON `conferences`;
CREATE UNIQUE INDEX `conferences_league_season_id_name_key`
    ON `conferences`(`league_season_id`, `name`);
