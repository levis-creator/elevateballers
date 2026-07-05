-- Additive: give league_staff an optional bio (shown on the leadership spotlight
-- cards of the /staff page). Forward-only; Prisma won't re-run an applied migration.
ALTER TABLE `league_staff` ADD COLUMN `bio` TEXT NULL;
