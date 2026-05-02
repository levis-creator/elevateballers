-- Adds a public URL slug to matches so we can serve human-readable URLs
-- like /matches/shark-attack-vs-tiger-claws-2026-03-25/ instead of cuids.
-- The column is nullable for now so deploy is safe; a backfill script
-- (scripts/backfill-match-slugs.ts) populates existing rows after this
-- migration runs. Slugs are unique across all matches.

-- AlterTable
ALTER TABLE `matches` ADD COLUMN `slug` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `matches_slug_key` ON `matches`(`slug`);
