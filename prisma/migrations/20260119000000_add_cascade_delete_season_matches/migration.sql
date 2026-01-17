-- AlterTable
-- Update foreign key constraint to cascade delete matches when season is deleted
ALTER TABLE "matches" DROP CONSTRAINT IF EXISTS "matches_season_id_fkey";

-- AddForeignKey
-- Recreate foreign key with CASCADE delete
ALTER TABLE "matches" ADD CONSTRAINT "matches_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
