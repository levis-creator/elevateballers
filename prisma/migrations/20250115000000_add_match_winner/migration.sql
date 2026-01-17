-- AlterTable
-- Add winner_id column to matches table
ALTER TABLE "matches" ADD COLUMN "winner_id" TEXT;

-- CreateIndex
CREATE INDEX "matches_winner_id_idx" ON "matches"("winner_id");

-- AddForeignKey
-- Add foreign key constraint for winner relation
ALTER TABLE "matches" ADD CONSTRAINT "matches_winner_id_fkey" FOREIGN KEY ("winner_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
