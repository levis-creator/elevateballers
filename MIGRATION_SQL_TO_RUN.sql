-- Migration: Add bracket_type to seasons table
-- Run this SQL in your database if the migration hasn't been applied

-- Check if column already exists (optional - will error if exists, but that's okay)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'seasons' 
        AND column_name = 'bracket_type'
    ) THEN
        -- AlterTable
        ALTER TABLE "seasons" ADD COLUMN "bracket_type" TEXT;

        -- CreateIndex
        CREATE INDEX "seasons_bracket_type_idx" ON "seasons"("bracket_type");
        
        RAISE NOTICE 'Migration applied successfully';
    ELSE
        RAISE NOTICE 'Column bracket_type already exists';
    END IF;
END $$;
