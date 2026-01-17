-- AlterTable
ALTER TABLE "seasons" ADD COLUMN "bracket_type" TEXT;

-- CreateIndex
CREATE INDEX "seasons_bracket_type_idx" ON "seasons"("bracket_type");
