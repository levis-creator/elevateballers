-- AlterTable
-- Add bracket relationship fields to matches table
ALTER TABLE "matches" ADD COLUMN "next_winner_match_id" TEXT;
ALTER TABLE "matches" ADD COLUMN "next_loser_match_id" TEXT;
ALTER TABLE "matches" ADD COLUMN "bracket_position" INTEGER;
ALTER TABLE "matches" ADD COLUMN "bracket_round" INTEGER;
ALTER TABLE "matches" ADD COLUMN "bracket_type" TEXT;

-- CreateIndex
CREATE INDEX "matches_next_winner_match_id_idx" ON "matches"("next_winner_match_id");
CREATE INDEX "matches_next_loser_match_id_idx" ON "matches"("next_loser_match_id");
CREATE INDEX "matches_bracket_position_idx" ON "matches"("bracket_position");
CREATE INDEX "matches_bracket_round_idx" ON "matches"("bracket_round");
CREATE INDEX "matches_bracket_type_idx" ON "matches"("bracket_type");

-- AddForeignKey
-- Add foreign key constraints for self-referential relations
ALTER TABLE "matches" ADD CONSTRAINT "matches_next_winner_match_id_fkey" FOREIGN KEY ("next_winner_match_id") REFERENCES "matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "matches" ADD CONSTRAINT "matches_next_loser_match_id_fkey" FOREIGN KEY ("next_loser_match_id") REFERENCES "matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
