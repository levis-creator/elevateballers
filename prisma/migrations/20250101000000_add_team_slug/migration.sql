-- AlterTable
-- Add slug column (nullable first)
ALTER TABLE "teams" ADD COLUMN "slug" TEXT;

-- Generate slugs for existing teams based on their names
-- This uses a simple slug generation: lowercase, replace spaces with hyphens, remove special chars
-- Handle duplicates by appending a number
DO $$
DECLARE
    team_record RECORD;
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER;
BEGIN
    FOR team_record IN SELECT id, name FROM "teams" ORDER BY "created_at" LOOP
        -- Generate base slug
        base_slug := LOWER(REGEXP_REPLACE(REGEXP_REPLACE(team_record.name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
        -- Remove leading/trailing hyphens
        base_slug := TRIM(BOTH '-' FROM base_slug);
        
        final_slug := base_slug;
        counter := 1;
        
        -- Check for uniqueness and append number if needed
        WHILE EXISTS (SELECT 1 FROM "teams" WHERE "slug" = final_slug AND id != team_record.id) LOOP
            final_slug := base_slug || '-' || counter;
            counter := counter + 1;
        END LOOP;
        
        -- Update the team with the unique slug
        UPDATE "teams" SET "slug" = final_slug WHERE id = team_record.id;
    END LOOP;
END $$;

-- Make slug NOT NULL and UNIQUE
ALTER TABLE "teams" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "teams" ADD CONSTRAINT "teams_slug_key" UNIQUE ("slug");

-- CreateIndex
CREATE INDEX "teams_slug_idx" ON "teams"("slug");

