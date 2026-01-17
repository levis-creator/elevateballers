-- ============================================
-- WINNER MIGRATION SQL - COPY AND PASTE THIS
-- ============================================
-- Run this in Supabase SQL Editor:
-- 1. Go to: https://supabase.com/dashboard
-- 2. Select your project
-- 3. Click "SQL Editor" → "New query"
-- 4. Paste everything below
-- 5. Click "Run" (or Ctrl+Enter)
-- ============================================

-- AlterTable
-- Add winner_id column to matches table
ALTER TABLE "matches" ADD COLUMN "winner_id" TEXT;

-- CreateIndex
CREATE INDEX "matches_winner_id_idx" ON "matches"("winner_id");

-- AddForeignKey
-- Add foreign key constraint for winner relation
ALTER TABLE "matches" ADD CONSTRAINT "matches_winner_id_fkey" FOREIGN KEY ("winner_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================
-- VERIFICATION (optional - run after migration)
-- ============================================
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'matches' AND column_name = 'winner_id';
